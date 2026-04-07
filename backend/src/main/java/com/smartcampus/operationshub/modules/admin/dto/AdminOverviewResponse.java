package com.smartcampus.operationshub.modules.admin.dto;

public record AdminOverviewResponse(
        long totalUsers,
        long activeResources,
        long totalTickets,
        long pendingBookings
) {
}
