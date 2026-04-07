package com.smartcampus.operationshub.modules.auth.dto;

import java.util.Set;

public record AuthUserResponse(Long id, String email, String fullName, Set<String> roles) {
}
