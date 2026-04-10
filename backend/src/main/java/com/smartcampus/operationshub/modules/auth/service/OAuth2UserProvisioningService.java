package com.smartcampus.operationshub.modules.auth.service;

import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.RoleRepository;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import com.smartcampus.operationshub.security.RoleConstants;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OAuth2UserProvisioningService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public OAuth2UserProvisioningService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public User provisionGoogleUser(Map<String, Object> attributes) {
        String email = normalizeEmail((String) attributes.get("email"));
        String subject = (String) attributes.get("sub");
        String name = (String) attributes.getOrDefault("name", email);

        User user = userRepository.findByOauthProviderAndOauthSubject("google", subject)
            .orElseGet(() -> userRepository.findByEmailIgnoreCase(email).orElseGet(User::new));

        user.setEmail(email);
        user.setFullName(name);
        user.setOauthProvider("google");
        user.setOauthSubject(subject);
        user.setActive(true);

        if (user.getRoles().isEmpty()) {
            Role userRole = roleRepository.findByCode(RoleConstants.ROLE_USER)
                    .orElseThrow(() -> new IllegalStateException("USER role not found in roles table"));
            user.getRoles().add(userRole);
        }

        return userRepository.save(user);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
