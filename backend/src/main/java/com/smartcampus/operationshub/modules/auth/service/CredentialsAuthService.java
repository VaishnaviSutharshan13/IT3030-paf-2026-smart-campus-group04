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
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("An account with this email already exists");
        }

        Role userRole = roleRepository.findByCode(RoleConstants.ROLE_USER)
            .orElseGet(() -> createRole(RoleConstants.ROLE_USER, "Standard User"));

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

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessRuleException("Invalid email or password"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BusinessRuleException("Your account has been deactivated");
        }

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        boolean exists = userRepository.findByEmail(email).isPresent();

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
