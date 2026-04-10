package com.smartcampus.operationshub.modules.incidents.dto;

import java.time.LocalDateTime;

public record IncidentResponse(
        Long id,
        Long reportedBy,
        String reportedByName,
        String locationType,
        String floor,
        String issueType,
        String description,
        String priority,
        String status,
        Long assignedTo,
        String assignedToName,
        String technicianNotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
