package com.smartcampus.operationshub.modules.auth.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ConflictException;
import com.smartcampus.operationshub.modules.auth.dto.AuthResponse;
import com.smartcampus.operationshub.modules.auth.dto.ForgotPasswordRequest;
import com.smartcampus.operationshub.modules.auth.dto.ForgotPasswordResponse;
import com.smartcampus.operationshub.modules.auth.dto.LoginRequest;
import com.smartcampus.operationshub.modules.auth.dto.RegisterRequest;
import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.RoleRepository;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import com.smartcampus.operationshub.security.RoleConstants;
import com.smartcampus.operationshub.security.jwt.JwtService;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CredentialsAuthService {

    private static final String GENERIC_LOGIN_FAILURE = "Login failed. Please check your credentials";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public CredentialsAuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessRuleException("Password and confirm password do not match");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ConflictException("An account with this email already exists");
        }

        String normalizedRole = normalizePublicRegistrationRole(request.getRole());
        Role userRole = roleRepository.findByCode(normalizedRole)
            .orElseGet(() -> createRole(normalizedRole, toDisplayName(normalizedRole)));

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.getRoles().add(userRole);

        User savedUser = userRepository.save(user);
        return toAuthResponse(savedUser);
    }

    private Role createRole(String code, String displayName) {
        Role role = new Role();
        role.setCode(code);
        role.setDisplayName(displayName);
        return roleRepository.save(role);
    }

    private String normalizePublicRegistrationRole(String role) {
        String value = role == null ? "" : role.trim().toUpperCase();
        if (value.endsWith("ADMIN")) {
            throw new BusinessRuleException("Admin registration is not allowed");
        }
        return switch (value) {
            case "STUDENT", "USER" -> RoleConstants.ROLE_STUDENT;
            case "LECTURER" -> RoleConstants.ROLE_LECTURER;
            case "TECHNICIAN" -> RoleConstants.ROLE_TECHNICIAN;
            default -> throw new BusinessRuleException("Unsupported registration role");
        };
    }

    private String toDisplayName(String roleCode) {
        return switch (roleCode) {
            case RoleConstants.ROLE_STUDENT -> "Student";
            case RoleConstants.ROLE_LECTURER -> "Lecturer";
            case RoleConstants.ROLE_TECHNICIAN -> "Technician";
            case RoleConstants.ROLE_ADMIN -> "Administrator";
            default -> "Standard User";
        };
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String rawPassword = request.getPassword() == null ? "" : request.getPassword().trim();
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new BusinessRuleException(GENERIC_LOGIN_FAILURE));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BusinessRuleException(GENERIC_LOGIN_FAILURE);
        }

        if (!user.isActive()) {
            throw new BusinessRuleException("Your account has been deactivated");
        }

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        boolean exists = userRepository.findByEmailIgnoreCase(email).isPresent();

        String message = exists
                ? "If this email exists, a reset link has been sent"
                : "If this email exists, a reset link has been sent";

        return new ForgotPasswordResponse(true, message);
    }

    private AuthResponse toAuthResponse(User user) {
        AppUserPrincipal principal = new AppUserPrincipal(user);
        String token = jwtService.generateToken(principal);
        Set<String> roles = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), roles);
    }
}
