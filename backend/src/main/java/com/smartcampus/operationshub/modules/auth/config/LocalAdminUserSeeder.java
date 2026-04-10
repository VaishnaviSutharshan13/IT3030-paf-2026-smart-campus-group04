package com.smartcampus.operationshub.modules.auth.config;

import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.RoleRepository;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import com.smartcampus.operationshub.security.RoleConstants;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
public class LocalAdminUserSeeder implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "admin@campus.edu";
    private static final String ADMIN_PASSWORD = "password";
    private static final String ADMIN_NAME = "System Admin";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public LocalAdminUserSeeder(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role adminRole = roleRepository.findByCode(RoleConstants.ROLE_ADMIN)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setCode(RoleConstants.ROLE_ADMIN);
                    role.setDisplayName("Administrator");
                    return roleRepository.save(role);
                });

        userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).ifPresentOrElse(
                existing -> {
                    boolean changed = false;

                    if (!existing.getRoles().contains(adminRole)) {
                        existing.getRoles().add(adminRole);
                        changed = true;
                    }

                    // Keep local profile credentials deterministic for development.
                    if (existing.getPasswordHash() == null
                            || !passwordEncoder.matches(ADMIN_PASSWORD, existing.getPasswordHash())) {
                        existing.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
                        changed = true;
                    }

                    if (changed) {
                        userRepository.save(existing);
                    }
                },
                () -> {
                    User admin = new User();
                    admin.setEmail(ADMIN_EMAIL);
                    admin.setFullName(ADMIN_NAME);
                    admin.setActive(true);
                    admin.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
                    admin.getRoles().add(adminRole);
                    userRepository.save(admin);
                }
        );
    }
}
