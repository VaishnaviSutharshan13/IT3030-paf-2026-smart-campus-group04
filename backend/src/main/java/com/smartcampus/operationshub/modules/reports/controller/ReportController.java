package com.smartcampus.operationshub.modules.reports.controller;

import com.smartcampus.operationshub.modules.bookings.repository.BookingRepository;
import com.smartcampus.operationshub.modules.reports.dto.AdminReportResponse;
import com.smartcampus.operationshub.modules.reports.dto.AdminReportUserResponse;
import com.smartcampus.operationshub.modules.resources.repository.ResourceRepository;
import com.smartcampus.operationshub.modules.tickets.repository.TicketRepository;
import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/reports", "/api/reports"})
public class ReportController {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public ReportController(
            BookingRepository bookingRepository,
            TicketRepository ticketRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository
    ) {
        this.bookingRepository = bookingRepository;
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

        return new AdminReportResponse(
                bookingRepository.count(),
                ticketRepository.count(),
                resourceRepository.findByActiveTrueOrderByNameAsc().size(),
                recentUsers
        );
    }

    private AdminReportUserResponse toRecentUser(User user) {
        String role = user.getRoles().stream()
                .map(Role::getCode)
                .findFirst()
                .orElse("USER");

        return new AdminReportUserResponse(user.getId(), user.getFullName(), user.getEmail(), role);
    }
}
