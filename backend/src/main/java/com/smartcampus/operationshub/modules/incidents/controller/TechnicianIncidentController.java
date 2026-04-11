package com.smartcampus.operationshub.modules.incidents.controller;

import com.smartcampus.operationshub.common.api.ApiResponse;
import com.smartcampus.operationshub.modules.incidents.dto.CreateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
import com.smartcampus.operationshub.modules.incidents.dto.TechnicianIncidentNoteRequest;
import com.smartcampus.operationshub.modules.incidents.dto.TechnicianIncidentStatusRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentStatusRequest;
import com.smartcampus.operationshub.modules.incidents.service.IncidentService;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/technician/incidents", "/api/v1/technician/incidents"})
public class TechnicianIncidentController {

    private static final List<String> ALLOWED_STATUSES = List.of("PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED");

    private final IncidentService incidentService;

    public TechnicianIncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping("/technician")
    public ResponseEntity<ApiResponse<IncidentResponse>> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication authentication
    ) {
        try {
            IncidentResponse created = incidentService.createTechnicianIncident(request, parseUserId(authentication));
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
        } catch (com.smartcampus.operationshub.common.exception.BusinessRuleException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(error.getMessage()));
        }
    }

    @GetMapping("/assigned")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> getAssigned(Authentication authentication) {
        try {
            Long userId = parseUserId(authentication);
            List<IncidentResponse> incidents = incidentService.listAssignedIncidents(userId);
            return ResponseEntity.ok(ApiResponse.ok(incidents == null ? List.of() : incidents));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(error.getMessage()));
        }
    }

    @PatchMapping("/{incidentId}/status")
    public ResponseEntity<ApiResponse<IncidentResponse>> updateStatus(
            @PathVariable Long incidentId,
            @Valid @RequestBody TechnicianIncidentStatusRequest request,
            Authentication authentication
    ) {
        try {
            if (incidentId == null || incidentId <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Incident id is required"));
            }

            String normalizedStatus = normalizeStatusInput(request.getStatus());
            if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid status value"));
            }

            UpdateIncidentStatusRequest statusRequest = new UpdateIncidentStatusRequest();
            statusRequest.setStatus(normalizedStatus);
            statusRequest.setNotes(null);

            boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
            boolean isTechnician = hasRole(authentication, "ROLE_TECHNICIAN");
            IncidentResponse updated = incidentService.updateStatus(
                    incidentId,
                    statusRequest,
                    parseUserId(authentication),
                    isAdmin,
                    isTechnician
            );

            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (com.smartcampus.operationshub.common.exception.ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        } catch (com.smartcampus.operationshub.common.exception.BusinessRuleException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(error.getMessage()));
        }
    }

    @PatchMapping("/{incidentId}/note")
    public ResponseEntity<ApiResponse<IncidentResponse>> updateNote(
            @PathVariable Long incidentId,
            @Valid @RequestBody TechnicianIncidentNoteRequest request,
            Authentication authentication
    ) {
        try {
            if (incidentId == null || incidentId <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Incident id is required"));
            }

            if (request.getNote() == null || request.getNote().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Note cannot be empty"));
            }

            boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
            UpdateIncidentRequest updateRequest = new UpdateIncidentRequest();
            updateRequest.setNotes(request.getNote());

            IncidentResponse updated = incidentService.updateIncident(
                    incidentId,
                    updateRequest,
                    parseUserId(authentication),
                    isAdmin
            );

            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (com.smartcampus.operationshub.common.exception.ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        } catch (com.smartcampus.operationshub.common.exception.BusinessRuleException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(error.getMessage()));
        }
    }

    @DeleteMapping("/{incidentId}")
    public ResponseEntity<ApiResponse<String>> deleteIncident(@PathVariable Long incidentId, Authentication authentication) {
        try {
            if (incidentId == null || incidentId <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Incident id is required"));
            }

            Long userId = parseUserId(authentication);
            boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
            incidentService.deleteIncident(incidentId, userId, isAdmin);
            return ResponseEntity.ok(ApiResponse.ok("Incident deleted"));
        } catch (com.smartcampus.operationshub.common.exception.ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        } catch (com.smartcampus.operationshub.common.exception.BusinessRuleException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(error.getMessage()));
        }
    }

    private String normalizeStatusInput(String status) {
        String value = String.valueOf(status).trim().toUpperCase();
        if ("IN PROGRESS".equals(value)) {
            return "IN_PROGRESS";
        }
        if ("PENDING".equals(value)) {
            return "PENDING";
        }
        if ("RESOLVED".equals(value)) {
            return "RESOLVED";
        }
        if ("CLOSED".equals(value)) {
            return "CLOSED";
        }
        return value;
    }

    private Long parseUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserPrincipal appUserPrincipal) {
            return appUserPrincipal.getId();
        }
        throw new IllegalStateException("Cannot extract authenticated user id");
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream().anyMatch(a -> role.equals(a.getAuthority()));
    }
}
