package com.smartcampus.operationshub.modules.admin.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ConflictException;
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
import com.smartcampus.operationshub.security.RoleConstants;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

    public AdminServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            ResourceRepository resourceRepository,
            TicketRepository ticketRepository,
            BookingRepository bookingRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.resourceRepository = resourceRepository;
        this.ticketRepository = ticketRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserResponse createUser(String fullName, String email, String password, String roleCode) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new ConflictException("An account with this email already exists");
        }

        String name = fullName == null ? "" : fullName.trim();
        if (name.length() < 3) {
            throw new BusinessRuleException("Name must contain at least 3 characters");
        }

        User user = new User();
        user.setFullName(name);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);
        user.getRoles().add(resolveRole(roleCode));

        return toResponse(userRepository.save(user));
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

        Role role = resolveRole(roleCode);

        user.getRoles().clear();
        user.getRoles().add(role);
        return toResponse(userRepository.save(user));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserResponse updateUser(Long userId, String roleCode, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (roleCode != null && !roleCode.trim().isEmpty()) {
            user.getRoles().clear();
            user.getRoles().add(resolveRole(roleCode));
        }

        if (status != null && !status.trim().isEmpty()) {
            String normalized = status.trim().toLowerCase();
            if (!"active".equals(normalized) && !"inactive".equals(normalized)) {
                throw new BusinessRuleException("Status must be 'active' or 'inactive'");
            }
            user.setActive("active".equals(normalized));
        }

        return toResponse(userRepository.save(user));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found: " + userId);
        }
        userRepository.deleteById(userId);
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

    private Role resolveRole(String roleCode) {
        String normalized = normalizeRoleCode(roleCode);
        return roleRepository.findByCode(normalized)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setCode(normalized);
                    role.setDisplayName(toDisplayName(normalized));
                    return roleRepository.save(role);
                });
    }

    private String normalizeRoleCode(String roleCode) {
        String value = roleCode == null ? "" : roleCode.trim().toUpperCase();
        if (value.endsWith("ADMIN")) {
            return RoleConstants.ROLE_ADMIN;
        }
        return switch (value) {
            case "STUDENT", "USER" -> RoleConstants.ROLE_STUDENT;
            case "TECHNICIAN" -> RoleConstants.ROLE_TECHNICIAN;
            case "LECTURER" -> RoleConstants.ROLE_LECTURER;
            case "ADMIN" -> RoleConstants.ROLE_ADMIN;
            default -> throw new BusinessRuleException("Unsupported role: " + roleCode);
        };
    }

    private String toDisplayName(String roleCode) {
        return switch (roleCode) {
            case RoleConstants.ROLE_LECTURER -> "Lecturer";
            case RoleConstants.ROLE_STUDENT, RoleConstants.ROLE_USER -> "Student";
            case RoleConstants.ROLE_ADMIN -> "Administrator";
            case RoleConstants.ROLE_TECHNICIAN -> "Technician";
            default -> "User";
        };
    }

    private AdminUserResponse toResponse(User user) {
        Set<String> roles = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        return new AdminUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.isActive(), roles);
    }
}
