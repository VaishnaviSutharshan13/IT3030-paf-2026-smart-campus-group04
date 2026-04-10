package com.smartcampus.operationshub.modules.reports.dto;

import java.util.List;

public record AdminReportResponse(
        long totalBookings,
        long totalTickets,
        long totalFacilities,
        List<AdminReportUserResponse> recentUsers
) {
}
