package com.smartcampus.operationshub.modules.users.controller;

import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping({"/api/v1/user", "/api/user"})
public class UserProfileController {

    private final UserRepository userRepository;

    public UserProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        User user = loadAuthenticatedUser(authentication);
        return ResponseEntity.ok(buildProfileResponse(user, "Profile loaded."));
    }

    @PatchMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication
    ) {
        User user = loadAuthenticatedUser(authentication);
        applyProfileFields(user, payload);
        userRepository.save(user);
        return ResponseEntity.ok(buildProfileResponse(user, "Profile updated successfully."));
    }

    @PatchMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication
    ) {
        User user = loadAuthenticatedUser(authentication);
        applySettingsFields(user, payload);
        userRepository.save(user);
        return ResponseEntity.ok(buildProfileResponse(user, "Settings updated successfully."));
    }

    private User loadAuthenticatedUser(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof AppUserPrincipal appUserPrincipal)) {
            throw new IllegalStateException("Cannot extract authenticated user id");
        }

        return userRepository.findById(appUserPrincipal.getId())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private void applyProfileFields(User user, Map<String, Object> payload) {
        if (payload == null) {
            return;
        }

        String name = valueAsString(payload.get("name"));
        if (name != null && !name.isBlank()) {
            user.setFullName(name.trim());
        }

        String email = valueAsString(payload.get("email"));
        if (email != null && !email.isBlank()) {
            user.setEmail(email.trim().toLowerCase());
        }
    }

    private void applySettingsFields(User user, Map<String, Object> payload) {
        if (payload == null) {
            return;
        }

        String email = valueAsString(payload.get("email"));
        if (email != null && !email.isBlank()) {
            user.setEmail(email.trim().toLowerCase());
        }
    }

    private String valueAsString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private Map<String, Object> buildProfileResponse(User user, String message) {
        Set<String> roleSet = user.getRoles().stream()
                .map(Role::getCode)
                .map(code -> String.valueOf(code).toLowerCase())
                .collect(Collectors.toSet());

        String role = roleSet.contains("admin")
                ? "admin"
                : roleSet.contains("lecturer")
                    ? "lecturer"
                    : roleSet.contains("technician")
                        ? "technician"
                        : "student";

        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("account", Map.of("twoFactorEnabled", false));
        settings.put("ui", Map.of("darkMode", false, "themeColor", "emerald"));
        settings.put("notifications", Map.of("emailNotifications", true, "systemAlerts", true));
        settings.put("admin", Map.of("modules", Map.of("bookings", true, "tickets", true, "resources", true, "reports", true)));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getFullName());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("role", role);
        response.put("status", user.isActive() ? "active" : "inactive");
        response.put("phone", "");
        response.put("address", "");
        response.put("bio", "");
        response.put("profileImageUrl", "");
        response.put("settings", settings);
        response.put("message", message);
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getFullName(),
                "email", user.getEmail(),
                "role", role,
                "status", user.isActive() ? "active" : "inactive"
        ));

        return response;
    }
}
