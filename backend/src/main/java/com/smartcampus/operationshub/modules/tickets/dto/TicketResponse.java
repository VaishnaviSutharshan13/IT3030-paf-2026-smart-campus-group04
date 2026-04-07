package com.smartcampus.operationshub.modules.tickets.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TicketResponse(
        Long id,
        Long reporterUserId,
        Long assignedTechnicianUserId,
        Long resourceId,
        String status,
        String priority,
        String title,
        String description,
        LocalDateTime incidentAt,
        LocalDateTime resolvedAt,
        List<String> imageUrls
) {
}
