package com.smartcampus.operationshub.modules.incidents.controller;

import com.smartcampus.operationshub.common.api.ApiResponse;
import com.smartcampus.operationshub.modules.incidents.dto.AssignIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.AssignTechnicianRequest;
import com.smartcampus.operationshub.modules.incidents.dto.CreateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentNoteRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentPriorityRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentStatusRequest;
import com.smartcampus.operationshub.modules.incidents.service.IncidentService;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/incidents", "/api/incidents"})
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping
    public ResponseEntity<IncidentResponse> reportIssue(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication authentication
    ) {
        IncidentResponse response = incidentService.reportIssue(request, parseUserId(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/technician")
    public ResponseEntity<ApiResponse<IncidentResponse>> createTechnicianIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication authentication
    ) {
        try {
            IncidentResponse created = incidentService.createTechnicianIncident(request, parseUserId(authentication));
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(error.getMessage()));
        }
    }

    @GetMapping
    public List<IncidentResponse> listIncidents(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String locationType
    ) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        boolean isTechnician = hasRole(authentication, "ROLE_TECHNICIAN");
        return incidentService.listIncidents(parseUserId(authentication), isAdmin, isTechnician, status, priority, locationType);
    }

    @GetMapping("/assigned")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> listAssignedIncidents(Authentication authentication) {
        try {
            Long userId = parseUserId(authentication);
            List<IncidentResponse> incidents = incidentService.listAssignedIncidents(userId);
            return ResponseEntity.ok(ApiResponse.ok(incidents == null ? List.of() : incidents));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(error.getMessage()));
        }
    }

    @PutMapping("/{incidentId}/assign")
    public IncidentResponse assignIncident(
            @PathVariable Long incidentId,
            @Valid @RequestBody AssignIncidentRequest request,
            Authentication authentication
    ) {
        return incidentService.assignIncident(incidentId, request, parseUserId(authentication));
    }

    @PatchMapping("/{incidentId}/assign")
    public IncidentResponse assignIncidentPatch(
            @PathVariable Long incidentId,
            @Valid @RequestBody AssignIncidentRequest request,
            Authentication authentication
    ) {
        return incidentService.assignIncident(incidentId, request, parseUserId(authentication));
    }

    @PutMapping("/{incidentId}/priority")
    public IncidentResponse updatePriority(
            @PathVariable Long incidentId,
            @Valid @RequestBody UpdateIncidentPriorityRequest request,
            Authentication authentication
    ) {
        return incidentService.updatePriority(incidentId, request, parseUserId(authentication));
    }

    @PutMapping("/{incidentId}/status")
    public IncidentResponse updateStatus(
            @PathVariable Long incidentId,
            @Valid @RequestBody UpdateIncidentStatusRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        boolean isTechnician = hasRole(authentication, "ROLE_TECHNICIAN");
        return incidentService.updateStatus(incidentId, request, parseUserId(authentication), isAdmin, isTechnician);
    }

    @PatchMapping("/{incidentId}/status")
    public IncidentResponse updateStatusPatch(
            @PathVariable Long incidentId,
            @Valid @RequestBody UpdateIncidentStatusRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        boolean isTechnician = hasRole(authentication, "ROLE_TECHNICIAN");
        return incidentService.updateStatus(incidentId, request, parseUserId(authentication), isAdmin, isTechnician);
    }

    @PatchMapping("/{incidentId}/note")
    public IncidentResponse updateNote(
            @PathVariable Long incidentId,
            @Valid @RequestBody UpdateIncidentNoteRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        UpdateIncidentRequest updateRequest = new UpdateIncidentRequest();
        updateRequest.setNotes(request.getNote());
        return incidentService.updateIncident(incidentId, updateRequest, parseUserId(authentication), isAdmin);
    }

    @PutMapping("/{incidentId}")
    public IncidentResponse updateIncident(
            @PathVariable Long incidentId,
            @RequestBody UpdateIncidentRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        return incidentService.updateIncident(incidentId, request, parseUserId(authentication), isAdmin);
    }

    @DeleteMapping("/{incidentId}")
    public ResponseEntity<ApiResponse<String>> deleteIncident(
            @PathVariable Long incidentId,
            Authentication authentication
    ) {
        try {
            Long actorUserId = parseUserId(authentication);
            boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
            incidentService.deleteIncident(incidentId, actorUserId, isAdmin);
            return ResponseEntity.ok(ApiResponse.ok("Incident deleted"));
        } catch (Exception error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(error.getMessage()));
        }
    }

    @PostMapping("/assign-technician")
    public IncidentResponse assignTechnician(
            @Valid @RequestBody AssignTechnicianRequest request,
            Authentication authentication
    ) {
        return incidentService.assignTechnician(request, parseUserId(authentication));
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
