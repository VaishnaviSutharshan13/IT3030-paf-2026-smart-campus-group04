package com.smartcampus.operationshub.modules.facilities.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.facilities.dto.FacilityRequest;
import com.smartcampus.operationshub.modules.facilities.dto.FacilityResponse;
import com.smartcampus.operationshub.modules.resources.entity.Resource;
import com.smartcampus.operationshub.modules.resources.entity.ResourceType;
import com.smartcampus.operationshub.modules.resources.repository.ResourceRepository;
import com.smartcampus.operationshub.modules.resources.repository.ResourceTypeRepository;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FacilityService {

    private final ResourceRepository resourceRepository;
    private final ResourceTypeRepository resourceTypeRepository;

    public FacilityService(ResourceRepository resourceRepository, ResourceTypeRepository resourceTypeRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceTypeRepository = resourceTypeRepository;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<FacilityResponse> listFacilities() {
        return resourceRepository.findAll().stream().map(this::toResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public FacilityResponse createFacility(FacilityRequest request, Long actorUserId) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BusinessRuleException("Name is required");
        }
        String typeCode = toTypeCode(request.getType());
        ResourceType type = resourceTypeRepository.findByCode(typeCode)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + typeCode));

        Resource resource = new Resource();
        resource.setResourceTypeId(type.getId());
        resource.setCode(generateCode(typeCode));
        resource.setName(request.getName().trim());
        resource.setLocation(normalizeLocation(request.getLocation()));
        resource.setCapacity(request.getCapacity() == null ? 1 : request.getCapacity());
        resource.setDescription("Created from facilities module");
        resource.setActive(toActive(request.getAvailabilityStatus(), true));
        resource.setCreatedBy(actorUserId);

        return toResponse(resourceRepository.save(resource));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public FacilityResponse updateFacility(Long id, FacilityRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            resource.setName(request.getName().trim());
        }
        if (request.getType() != null && !request.getType().isBlank()) {
            String typeCode = toTypeCode(request.getType());
            ResourceType type = resourceTypeRepository.findByCode(typeCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + typeCode));
            resource.setResourceTypeId(type.getId());
        }
        if (request.getCapacity() != null) {
            resource.setCapacity(request.getCapacity());
        }
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            resource.setLocation(request.getLocation().trim());
        }
        if (request.getAvailabilityStatus() != null && !request.getAvailabilityStatus().isBlank()) {
            resource.setActive(toActive(request.getAvailabilityStatus(), resource.isActive()));
        }

        return toResponse(resourceRepository.save(resource));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteFacility(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + id));
        resource.setActive(false);
        resourceRepository.save(resource);
    }

    private String normalizeLocation(String location) {
        if (location == null || location.isBlank()) {
            return "Main Campus";
        }
        return location.trim();
    }

    private String generateCode(String typeCode) {
        String prefix = switch (typeCode) {
            case "LAB" -> "LAB";
            case "EQUIPMENT" -> "EQUIP";
            default -> "ROOM";
        };
        long suffix = System.currentTimeMillis() % 100000;
        return prefix + "-" + suffix;
    }

    private String toTypeCode(String type) {
        String value = String.valueOf(type).trim().toUpperCase();
        if (value.startsWith("LAB")) {
            return "LAB";
        }
        if (value.startsWith("EQUIP")) {
            return "EQUIPMENT";
        }
        return "ROOM";
    }

    private boolean toActive(String availabilityStatus, boolean defaultValue) {
        if (availabilityStatus == null || availabilityStatus.isBlank()) {
            return defaultValue;
        }
        String value = availabilityStatus.trim().toUpperCase();
        return !value.equals("UNAVAILABLE") && !value.equals("OUT_OF_SERVICE");
    }

    private FacilityResponse toResponse(Resource resource) {
        String typeCode = resourceTypeRepository.findById(resource.getResourceTypeId())
                .map(ResourceType::getCode)
                .orElse("ROOM");

        String type = switch (typeCode) {
            case "LAB" -> "Lab";
            case "EQUIPMENT" -> "Equipment";
            default -> "Room";
        };

        return new FacilityResponse(
                resource.getId(),
                resource.getName(),
                type,
                resource.getCapacity(),
                resource.isActive() ? "Available" : "Unavailable",
                resource.getLocation(),
                resource.getCode()
        );
    }
}
