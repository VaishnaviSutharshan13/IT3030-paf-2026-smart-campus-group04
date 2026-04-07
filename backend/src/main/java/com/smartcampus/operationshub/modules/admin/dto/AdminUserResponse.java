package com.smartcampus.operationshub.modules.admin.dto;

import java.util.Set;

public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        boolean active,
        Set<String> roles
) {
}
