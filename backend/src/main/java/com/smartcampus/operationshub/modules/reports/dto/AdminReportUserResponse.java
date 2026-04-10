package com.smartcampus.operationshub.modules.reports.dto;

public record AdminReportUserResponse(
        Long id,
        String name,
        String email,
        String role
) {
}
