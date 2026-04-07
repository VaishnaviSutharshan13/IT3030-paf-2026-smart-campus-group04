package com.smartcampus.operationshub.modules.auth.controller;

import com.smartcampus.operationshub.modules.auth.dto.AuthUserResponse;
import com.smartcampus.operationshub.modules.auth.dto.AuthResponse;
import com.smartcampus.operationshub.modules.auth.dto.ForgotPasswordRequest;
import com.smartcampus.operationshub.modules.auth.dto.ForgotPasswordResponse;
import com.smartcampus.operationshub.modules.auth.dto.LoginRequest;
import com.smartcampus.operationshub.modules.auth.dto.RegisterRequest;
import com.smartcampus.operationshub.modules.auth.service.CredentialsAuthService;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import jakarta.validation.Valid;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final CredentialsAuthService credentialsAuthService;

    public AuthController(CredentialsAuthService credentialsAuthService) {
        this.credentialsAuthService = credentialsAuthService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(credentialsAuthService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(credentialsAuthService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(credentialsAuthService.forgotPassword(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            return ResponseEntity.status(401).build();
        }

        Set<String> roles = principal.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toSet());

        return ResponseEntity.ok(new AuthUserResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getFullName(),
                roles
        ));
    }
}
