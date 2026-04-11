package com.smartcampus.operationshub.modules.reports.dto;

import java.util.List;

public record AdminReportResponse(
        long totalBookings,
        long approvedBookings,
        long rejectedBookings,
        long totalIncidents,
        long resolvedIncidents,
        long totalFacilities,
        long completedBookings,
        long pendingBookings,
        long completedIncidents,
        long pendingIncidents,
        long totalTickets,
        List<AdminReportUserResponse> recentUsers
) {
}
