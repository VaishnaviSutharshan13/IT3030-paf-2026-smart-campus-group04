package com.smartcampus.operationshub.modules.auth.dto;

import java.util.Set;

public record AuthResponse(
        String token,
        Long userId,
        String fullName,
        String email,
        Set<String> roles
) {
}
