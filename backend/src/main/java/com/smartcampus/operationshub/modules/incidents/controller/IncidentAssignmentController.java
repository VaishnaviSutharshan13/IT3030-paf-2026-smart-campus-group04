package com.smartcampus.operationshub.modules.incidents.controller;

import com.smartcampus.operationshub.modules.incidents.dto.AssignTechnicianRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
import com.smartcampus.operationshub.modules.incidents.service.IncidentService;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1", "/api"})
public class IncidentAssignmentController {

    private final IncidentService incidentService;

    public IncidentAssignmentController(IncidentService incidentService) {
        this.incidentService = incidentService;
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
}
