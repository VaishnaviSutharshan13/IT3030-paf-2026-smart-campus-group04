package com.smartcampus.operationshub.modules.facilities.controller;

import com.smartcampus.operationshub.modules.facilities.dto.FacilityRequest;
import com.smartcampus.operationshub.modules.facilities.dto.FacilityResponse;
import com.smartcampus.operationshub.modules.facilities.service.FacilityService;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/facilities", "/api/facilities"})
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public List<FacilityResponse> listFacilities() {
        return facilityService.listFacilities();
    }

    @PostMapping
    public ResponseEntity<FacilityResponse> createFacility(
            @Valid @RequestBody FacilityRequest request,
            Authentication authentication
    ) {
        Long actorUserId = parseUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(facilityService.createFacility(request, actorUserId));
    }

    @PutMapping("/{facilityId}")
    public FacilityResponse updateFacility(
            @PathVariable Long facilityId,
            @RequestBody FacilityRequest request
    ) {
        return facilityService.updateFacility(facilityId, request);
    }

    @DeleteMapping("/{facilityId}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long facilityId) {
        facilityService.deleteFacility(facilityId);
        return ResponseEntity.noContent().build();
    }

    private Long parseUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserPrincipal appUserPrincipal) {
            return appUserPrincipal.getId();
        }
        throw new IllegalStateException("Cannot extract authenticated user id");
    }
}
