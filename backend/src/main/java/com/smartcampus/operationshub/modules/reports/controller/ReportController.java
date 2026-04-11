package com.smartcampus.operationshub.modules.reports.controller;

import com.smartcampus.operationshub.common.api.ApiResponse;
import com.smartcampus.operationshub.modules.bookings.repository.BookingRepository;
import com.smartcampus.operationshub.modules.bookings.entity.BookingStatus;
import com.smartcampus.operationshub.modules.incidents.entity.IncidentStatus;
import com.smartcampus.operationshub.modules.incidents.repository.IncidentRepository;
import com.smartcampus.operationshub.modules.reports.dto.AdminReportResponse;
import com.smartcampus.operationshub.modules.reports.dto.AdminReportUserResponse;
import com.smartcampus.operationshub.modules.resources.repository.ResourceRepository;
import com.smartcampus.operationshub.modules.tickets.repository.TicketRepository;
import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/reports", "/api/reports"})
public class ReportController {

    private final BookingRepository bookingRepository;
    private final IncidentRepository incidentRepository;
    private final TicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public ReportController(
            BookingRepository bookingRepository,
            IncidentRepository incidentRepository,
            TicketRepository ticketRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.incidentRepository = incidentRepository;
        this.ticketRepository = ticketRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AdminReportResponse getReport() {
        List<AdminReportUserResponse> recentUsers = userRepository.findTop5ByOrderByIdDesc().stream()
                .map(this::toRecentUser)
                .toList();

        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        long completedBookings = bookingRepository.countByStatus(BookingStatus.APPROVED);
        long rejectedBookings = bookingRepository.countByStatus(BookingStatus.REJECTED);
        long pendingIncidents = incidentRepository.countByStatusIn(
            EnumSet.of(IncidentStatus.PENDING, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS)
        );
        long completedIncidents = incidentRepository.countByStatus(IncidentStatus.RESOLVED);

        return new AdminReportResponse(
                bookingRepository.count(),
                completedBookings,
                rejectedBookings,
            incidentRepository.count(),
            completedIncidents,
            resourceRepository.findByActiveTrueOrderByNameAsc().size(),
            completedBookings,
            pendingBookings,
            completedIncidents,
            pendingIncidents,
                ticketRepository.count(),
                recentUsers
        );
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getSummary() {
        long totalBookings = bookingRepository.count();
        long approvedBookings = bookingRepository.countByStatus(BookingStatus.APPROVED);
        long rejectedBookings = bookingRepository.countByStatus(BookingStatus.REJECTED);
        long totalIncidents = incidentRepository.count();
        long resolvedIncidents = incidentRepository.countByStatus(IncidentStatus.RESOLVED);

        Map<String, Long> payload = Map.of(
                "totalBookings", totalBookings,
                "approvedBookings", approvedBookings,
                "rejectedBookings", rejectedBookings,
                "totalIncidents", totalIncidents,
                "resolvedIncidents", resolvedIncidents
        );

        return ResponseEntity.ok(ApiResponse.ok(payload));
    }

    private AdminReportUserResponse toRecentUser(User user) {
        String role = user.getRoles().stream()
                .map(Role::getCode)
                .findFirst()
                .orElse("USER");

        return new AdminReportUserResponse(user.getId(), user.getFullName(), user.getEmail(), role);
    }
}
