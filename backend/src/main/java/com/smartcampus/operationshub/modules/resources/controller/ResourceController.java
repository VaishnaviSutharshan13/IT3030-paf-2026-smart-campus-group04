package com.smartcampus.operationshub.modules.resources.controller;

import com.smartcampus.operationshub.modules.resources.dto.ResourceRequest;
import com.smartcampus.operationshub.modules.resources.dto.ResourceResponse;
import com.smartcampus.operationshub.modules.resources.service.ResourceService;
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
@RequestMapping("/api/v1/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public List<ResourceResponse> listResources() {
        return resourceService.listResources();
    }

    @GetMapping("/{id}")
    public ResourceResponse getResource(@PathVariable Long id) {
        return resourceService.getResource(id);
    }

    @PostMapping
    public ResponseEntity<ResourceResponse> createResource(
            @Valid @RequestBody ResourceRequest request,
            Authentication authentication
    ) {
        Long actorUserId = parseUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(request, actorUserId));
    }

    @PutMapping("/{id}")
    public ResourceResponse updateResource(@PathVariable Long id, @Valid @RequestBody ResourceRequest request) {
        return resourceService.updateResource(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
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
