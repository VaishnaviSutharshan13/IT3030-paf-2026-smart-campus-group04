package com.smartcampus.operationshub.modules.incidents.controller;

import com.smartcampus.operationshub.modules.incidents.dto.AssignIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.CreateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
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

    @PutMapping("/{incidentId}/assign")
    public IncidentResponse assignIncident(
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
