package com.smartcampus.operationshub.modules.incidents.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.incidents.dto.AssignIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.AssignTechnicianRequest;
import com.smartcampus.operationshub.modules.incidents.dto.CreateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentRequest;
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
        return createIncident(request, lecturerUserId, "lecturer");
    }

    @Override
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public IncidentResponse createTechnicianIncident(CreateIncidentRequest request, Long technicianUserId) {
        return createIncident(request, technicianUserId, "technician");
    }

    private IncidentResponse createIncident(CreateIncidentRequest request, Long reporterUserId, String reporterRole) {
        if (request.getFloor() == null || request.getFloor().isBlank()) {
            throw new BusinessRuleException("Validation failed");
        }

        Incident incident = new Incident();
        incident.setReportedBy(reporterUserId);
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
                    reporterUserId,
                    "SYSTEM",
                    "New Incident Reported",
                    "A " + reporterRole + " reported a " + saved.getIssueType() + " issue on " + saved.getFloor() + "."
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
    public IncidentResponse assignTechnician(AssignTechnicianRequest request, Long adminUserId) {
        AssignIncidentRequest assignRequest = new AssignIncidentRequest();
        assignRequest.setTechnicianUserId(request.getTechnicianUserId());
        assignRequest.setPriority(request.getPriority());
        return assignIncident(request.getIncidentId(), assignRequest, adminUserId);
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

        if (!isAdmin && isTechnician && incident.getAssignedTo() != null && !actorUserId.equals(incident.getAssignedTo())) {
            throw new BusinessRuleException("You can only update incidents assigned to you");
        }

        if (!isAdmin && isTechnician && incident.getAssignedTo() == null && incident.getStatus() == IncidentStatus.PENDING) {
            incident.setAssignedTo(actorUserId);
            incident.setStatus(IncidentStatus.ASSIGNED);
        }

        IncidentStatus target = parseStatus(request.getStatus());
        if (!incident.getStatus().canTransitionTo(target)) {
            throw new BusinessRuleException(
                    "Invalid incident transition: " + incident.getStatus() + " -> " + target
            );
        }

        incident.setStatus(target);
        incident.setTechnicianNotes(normalizeNotes(request.getNotes()));

        Incident saved = incidentRepository.save(incident);

        try {
            String title;
            String message;
            switch (target) {
                case ASSIGNED -> {
                    title = "Incident Approved";
                    message = "Incident #" + saved.getId() + " was approved by technician.";
                }
                case REJECTED -> {
                    title = "Incident Rejected";
                    message = "Incident #" + saved.getId() + " was rejected by technician.";
                }
                case IN_PROGRESS -> {
                    title = "Incident In Progress";
                    message = "Work started on incident #" + saved.getId() + ".";
                }
                case RESOLVED -> {
                    title = "Incident Finished";
                    message = "Incident #" + saved.getId() + " has been completed.";
                }
                default -> {
                    title = "Incident Updated";
                    message = "Incident #" + saved.getId() + " status changed to " + target + ".";
                }
            }
            notificationService.createNotification(
                    saved.getReportedBy(),
                    actorUserId,
                    "SYSTEM",
                    title,
                    message
            );
        } catch (Exception ignored) {
            // Status update is already persisted; notification failures should not fail the request.
        }

        return toResponse(saved);
    }

    @Override
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public IncidentResponse updateIncident(Long incidentId, UpdateIncidentRequest request, Long actorUserId, boolean isAdmin) {
        Incident incident = getIncidentOrThrow(incidentId);

        if (!isAdmin) {
            boolean isAssignedTechnician = incident.getAssignedTo() != null && actorUserId.equals(incident.getAssignedTo());
            boolean isReporter = actorUserId.equals(incident.getReportedBy());
            if (!isAssignedTechnician && !isReporter) {
                throw new BusinessRuleException("You can only edit incidents assigned to you");
            }
        }

        if (request.getAssignedTo() != null) {
            if (!isAdmin) {
                throw new BusinessRuleException("Only admins can reassign incidents");
            }
            if (!userRepository.existsByIdAndRoleCode(request.getAssignedTo(), RoleConstants.ROLE_TECHNICIAN)) {
                throw new BusinessRuleException("Selected assignee is not a technician");
            }
            incident.setAssignedTo(request.getAssignedTo());
            if (incident.getStatus() == IncidentStatus.PENDING) {
                incident.setStatus(IncidentStatus.ASSIGNED);
            }
        }

        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            if (!isAdmin) {
                throw new BusinessRuleException("Only admins can change priority");
            }
            incident.setPriority(parsePriority(request.getPriority()));
        }

        if (request.getIssueType() != null && !request.getIssueType().isBlank()) {
            incident.setIssueType(normalizeIssueType(request.getIssueType()));
        }

        if (request.getLocationType() != null && !request.getLocationType().isBlank()) {
            incident.setLocationType(normalizeLocationType(request.getLocationType()));
        }

        if (request.getFloor() != null && !request.getFloor().isBlank()) {
            incident.setFloor(request.getFloor().trim());
        }

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            incident.setDescription(request.getDescription().trim());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            UpdateIncidentStatusRequest statusRequest = new UpdateIncidentStatusRequest();
            statusRequest.setStatus(request.getStatus());
            statusRequest.setNotes(request.getNotes());
            return updateStatus(incidentId, statusRequest, actorUserId, isAdmin, !isAdmin);
        }

        incident.setTechnicianNotes(normalizeNotes(request.getNotes()));
        return toResponse(incidentRepository.save(incident));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public List<IncidentResponse> listAssignedIncidents(Long technicianUserId) {
        return incidentRepository.findByAssignedToOrderByCreatedAtDesc(technicianUserId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public void deleteIncident(Long incidentId, Long actorUserId, boolean isAdmin) {
        Incident incident = getIncidentOrThrow(incidentId);
        if (!isAdmin) {
            if (incident.getAssignedTo() == null || !actorUserId.equals(incident.getAssignedTo())) {
                throw new BusinessRuleException("You can only delete incidents assigned to you");
            }
        }
        incidentRepository.delete(incident);
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
        if ("OPEN".equals(value)) {
            return IncidentStatus.PENDING;
        }
        if ("APPROVED".equals(value)) {
            return IncidentStatus.ASSIGNED;
        }
        if ("COMPLETED".equals(value)) {
            return IncidentStatus.RESOLVED;
        }
        if ("FINISHED".equals(value) || "DONE".equals(value)) {
            return IncidentStatus.RESOLVED;
        }
        if ("CLOSE".equals(value) || "CLOSED".equals(value)) {
            return IncidentStatus.RESOLVED;
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
        if ("OPEN".equals(value)) {
            return IncidentStatus.PENDING;
        }
        if ("APPROVED".equals(value)) {
            return IncidentStatus.ASSIGNED;
        }
        if ("COMPLETED".equals(value)) {
            return IncidentStatus.RESOLVED;
        }
        if ("FINISHED".equals(value) || "DONE".equals(value)) {
            return IncidentStatus.RESOLVED;
        }
        if ("CLOSE".equals(value) || "CLOSED".equals(value)) {
            return IncidentStatus.RESOLVED;
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

    private String normalizeNotes(String notes) {
        if (notes == null) {
            return null;
        }
        String trimmed = notes.trim();
        return trimmed.isEmpty() ? null : trimmed;
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
