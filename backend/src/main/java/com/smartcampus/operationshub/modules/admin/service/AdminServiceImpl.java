package com.smartcampus.operationshub.modules.admin.service;

import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.admin.dto.AdminOverviewResponse;
import com.smartcampus.operationshub.modules.admin.dto.AdminUserResponse;
import com.smartcampus.operationshub.modules.bookings.entity.BookingStatus;
import com.smartcampus.operationshub.modules.bookings.repository.BookingRepository;
import com.smartcampus.operationshub.modules.resources.repository.ResourceRepository;
import com.smartcampus.operationshub.modules.tickets.repository.TicketRepository;
import com.smartcampus.operationshub.modules.users.entity.Role;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.RoleRepository;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ResourceRepository resourceRepository;
    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;

    public AdminServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            ResourceRepository resourceRepository,
            TicketRepository ticketRepository,
            BookingRepository bookingRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.resourceRepository = resourceRepository;
        this.ticketRepository = ticketRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminUserResponse> listUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserResponse updateUserRole(Long userId, String roleCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Role role = roleRepository.findByCode(roleCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleCode));

        user.getRoles().clear();
        user.getRoles().add(role);
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public AdminOverviewResponse getOverview() {
        long totalUsers = userRepository.count();
        long activeResources = resourceRepository.findByActiveTrueOrderByNameAsc().size();
        long totalTickets = ticketRepository.count();
        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        return new AdminOverviewResponse(totalUsers, activeResources, totalTickets, pendingBookings);
    }

    private AdminUserResponse toResponse(User user) {
        Set<String> roles = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        return new AdminUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.isActive(), roles);
    }
}
