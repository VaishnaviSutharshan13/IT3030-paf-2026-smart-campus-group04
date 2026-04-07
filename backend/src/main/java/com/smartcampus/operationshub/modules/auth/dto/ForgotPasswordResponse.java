package com.smartcampus.operationshub.modules.auth.dto;

public record ForgotPasswordResponse(
        boolean sent,
        String message
) {
}
