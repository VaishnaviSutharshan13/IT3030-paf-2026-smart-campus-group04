package com.smartcampus.operationshub.modules.users.service;

import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.repository.RoleRepository;
import com.smartcampus.operationshub.security.RoleConstants;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class RoleBootstrapService implements ApplicationRunner {

    private final RoleRepository roleRepository;

    public RoleBootstrapService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureRole(RoleConstants.ROLE_USER, "Standard User");
        ensureRole(RoleConstants.ROLE_STUDENT, "Student");
        ensureRole(RoleConstants.ROLE_LECTURER, "Lecturer");
        ensureRole(RoleConstants.ROLE_TECHNICIAN, "Technician");
        ensureRole(RoleConstants.ROLE_ADMIN, "Administrator");
    }

    private void ensureRole(String code, String displayName) {
        roleRepository.findByCode(code).orElseGet(() -> {
            Role role = new Role();
            role.setCode(code);
            role.setDisplayName(displayName);
            return roleRepository.save(role);
        });
    }
}
