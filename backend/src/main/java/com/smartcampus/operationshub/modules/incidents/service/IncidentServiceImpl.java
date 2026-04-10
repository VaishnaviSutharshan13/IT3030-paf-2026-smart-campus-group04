package com.smartcampus.operationshub.modules.incidents.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.incidents.dto.AssignIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.CreateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentPriorityRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentStatusRequest;
import com.smartcampus.operationshub.modules.incidents.entity.Incident;
import com.smartcampus.operationshub.modules.incidents.entity.IncidentPriority;
import com.smartcampus.operationshub.modules.incidents.entity.IncidentStatus;
import com.smartcampus.operationshub.modules.incidents.repository.IncidentRepository;
import com.smartcampus.operationshub.modules.notifications.service.NotificationService;
import com.smartcampus.operationshub.modules.users.entity.User;
import com.smartcampus.operationshub.modules.users.repository.UserRepository;
import com.smartcampus.operationshub.security.RoleConstants;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public IncidentServiceImpl(
            IncidentRepository incidentRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @PreAuthorize("hasRole('LECTURER')")
    public IncidentResponse reportIssue(CreateIncidentRequest request, Long lecturerUserId) {
        if (request.getFloor() == null || request.getFloor().isBlank()) {
            throw new BusinessRuleException("Validation failed");
        }

        Incident incident = new Incident();
        incident.setReportedBy(lecturerUserId);
        incident.setLocationType(normalizeLocationType(request.getLocationType()));
        incident.setFloor(request.getFloor().trim());
        incident.setIssueType(normalizeIssueType(request.getIssueType()));
        incident.setDescription(request.getDescription().trim());
        incident.setPriority(parsePriority(request.getPriority()));
        incident.setStatus(IncidentStatus.PENDING);

        Incident saved = incidentRepository.save(incident);

        List<Long> adminIds = userRepository.findActiveUserIdsByRoleCode(RoleConstants.ROLE_ADMIN);
        for (Long adminId : adminIds) {
            notificationService.createNotification(
                    adminId,
                    lecturerUserId,
                    "SYSTEM",
                    "New Incident Reported",
                    "A lecturer reported a " + saved.getIssueType() + " issue on " + saved.getFloor() + "."
            );
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('LECTURER','ADMIN','TECHNICIAN')")
    public List<IncidentResponse> listIncidents(
            Long currentUserId,
            boolean isAdmin,
            boolean isTechnician,
            String status,
            String priority,
            String locationType
    ) {
        Long reporterId = null;
        Long assigneeId = null;
        if (!isAdmin && isTechnician) {
            assigneeId = currentUserId;
        } else if (!isAdmin) {
            reporterId = currentUserId;
        }

        List<Incident> incidents = incidentRepository.findByFilters(
                reporterId,
                assigneeId,
            parseStatusOrNull(status),
            parsePriorityOrNull(priority),
                normalizeOptional(locationType)
        );

        return incidents.stream().map(this::toResponse).toList();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public IncidentResponse assignIncident(Long incidentId, AssignIncidentRequest request, Long adminUserId) {
        Incident incident = getIncidentOrThrow(incidentId);
        if (incident.getStatus() == IncidentStatus.RESOLVED) {
            throw new BusinessRuleException("Cannot assign a resolved incident");
        }

        Long technicianId = request.getTechnicianUserId();
        if (!userRepository.existsByIdAndRoleCode(technicianId, RoleConstants.ROLE_TECHNICIAN)) {
            throw new BusinessRuleException("Selected assignee is not a technician");
        }

        incident.setAssignedTo(technicianId);
        incident.setStatus(IncidentStatus.ASSIGNED);

        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            incident.setPriority(parsePriority(request.getPriority()));
        }

        Incident saved = incidentRepository.save(incident);

        notificationService.createNotification(
                technicianId,
                adminUserId,
                "SYSTEM",
                "Incident Assigned",
                "You have been assigned incident #" + saved.getId() + "."
        );

        return toResponse(saved);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public IncidentResponse updatePriority(Long incidentId, UpdateIncidentPriorityRequest request, Long adminUserId) {
        Incident incident = getIncidentOrThrow(incidentId);
        incident.setPriority(parsePriority(request.getPriority()));
        return toResponse(incidentRepository.save(incident));
    }

    @Override
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public IncidentResponse updateStatus(
            Long incidentId,
            UpdateIncidentStatusRequest request,
            Long actorUserId,
            boolean isAdmin,
            boolean isTechnician
    ) {
        Incident incident = getIncidentOrThrow(incidentId);

        if (!isAdmin && isTechnician) {
            if (incident.getAssignedTo() == null || !actorUserId.equals(incident.getAssignedTo())) {
                throw new BusinessRuleException("You can only update incidents assigned to you");
            }
        }

        IncidentStatus target = parseStatus(request.getStatus());
        if (!incident.getStatus().canTransitionTo(target)) {
            throw new BusinessRuleException(
                    "Invalid incident transition: " + incident.getStatus() + " -> " + target
            );
        }

        incident.setStatus(target);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            incident.setTechnicianNotes(request.getNotes().trim());
        }

        Incident saved = incidentRepository.save(incident);

        if (target == IncidentStatus.RESOLVED) {
            notificationService.createNotification(
                    saved.getReportedBy(),
                    actorUserId,
                    "SYSTEM",
                    "Incident Resolved",
                    "Incident #" + saved.getId() + " has been resolved."
            );
        }

        return toResponse(saved);
    }

    private Incident getIncidentOrThrow(Long incidentId) {
        return incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));
    }

    private IncidentPriority parsePriority(String priority) {
        String value = normalizeOptional(priority);
        if (value == null) {
            throw new BusinessRuleException("Priority is required");
        }
        try {
            return IncidentPriority.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("Unsupported incident priority: " + priority);
        }
    }

    private IncidentStatus parseStatus(String status) {
        String value = normalizeOptional(status);
        if (value == null) {
            throw new BusinessRuleException("Status is required");
        }
        try {
            return IncidentStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("Unsupported incident status: " + status);
        }
    }

    private IncidentPriority parsePriorityOrNull(String priority) {
        String value = normalizeOptional(priority);
        if (value == null) {
            return null;
        }
        try {
            return IncidentPriority.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("Unsupported incident priority: " + priority);
        }
    }

    private IncidentStatus parseStatusOrNull(String status) {
        String value = normalizeOptional(status);
        if (value == null) {
            return null;
        }
        try {
            return IncidentStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("Unsupported incident status: " + status);
        }
    }

    private String normalizeLocationType(String locationType) {
        String value = normalizeOptional(locationType);
        if (value == null) {
            throw new BusinessRuleException("Validation failed");
        }

        return switch (value) {
            case "LECTURE_HALL", "SMART_CLASSROOM", "CLASSROOM", "LAB" -> value;
            default -> throw new BusinessRuleException("Validation failed");
        };
    }

    private String normalizeIssueType(String issueType) {
        String value = normalizeOptional(issueType);
        if (value == null) {
            throw new BusinessRuleException("Validation failed");
        }

        return switch (value) {
            case "COMPUTER", "AC", "LIGHTS", "PROJECTOR", "NETWORK", "OTHER" -> value;
            default -> throw new BusinessRuleException("Validation failed");
        };
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private IncidentResponse toResponse(Incident incident) {
        String reportedByName = userRepository.findById(incident.getReportedBy())
                .map(User::getFullName)
                .orElse("Unknown User");

        String assignedToName = incident.getAssignedTo() == null
                ? null
                : userRepository.findById(incident.getAssignedTo())
                    .map(User::getFullName)
                    .orElse("Unknown Technician");

        return new IncidentResponse(
                incident.getId(),
                incident.getReportedBy(),
                reportedByName,
                incident.getLocationType(),
                incident.getFloor(),
                incident.getIssueType(),
                incident.getDescription(),
                incident.getPriority().name(),
                incident.getStatus().name(),
                incident.getAssignedTo(),
                assignedToName,
                incident.getTechnicianNotes(),
                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}
