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
import java.util.Locale;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

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
        ResourceType type = resolveResourceType(request.getType());

        Resource resource = new Resource();
        resource.setResourceTypeId(type.getId());
        resource.setCode(generateCode(type.getCode()));
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
            ResourceType type = resolveResourceType(request.getType());
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
        try {
            resourceRepository.delete(resource);
            resourceRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessRuleException("This resource cannot be deleted because it is referenced by existing records.");
        }
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

    private ResourceType resolveResourceType(String typeInput) {
        String normalizedCode = normalizeTypeCode(typeInput);
        return resourceTypeRepository.findByCode(normalizedCode)
                .orElseGet(() -> {
                    ResourceType type = new ResourceType();
                    type.setCode(normalizedCode);
                    type.setDisplayName(normalizeTypeDisplayName(typeInput));
                    return resourceTypeRepository.save(type);
                });
    }

    private String normalizeTypeCode(String rawType) {
        String fallback = "ROOM";
        if (rawType == null || rawType.isBlank()) {
            return fallback;
        }

        String cleaned = rawType.trim().toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_')
                .replaceAll("[^A-Z0-9_]", "");

        if (cleaned.isBlank()) {
            return fallback;
        }

        if (cleaned.length() > 32) {
            return cleaned.substring(0, 32);
        }
        return cleaned;
    }

    private String normalizeTypeDisplayName(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return "Room";
        }
        String trimmed = rawType.trim();
        if (trimmed.length() <= 64) {
            return trimmed;
        }
        return trimmed.substring(0, 64);
    }

    private boolean toActive(String availabilityStatus, boolean defaultValue) {
        if (availabilityStatus == null || availabilityStatus.isBlank()) {
            return defaultValue;
        }
        String value = availabilityStatus.trim().toUpperCase();
        return !value.equals("UNAVAILABLE") && !value.equals("OUT_OF_SERVICE");
    }

    private FacilityResponse toResponse(Resource resource) {
        ResourceType type = resourceTypeRepository.findById(resource.getResourceTypeId())
            .orElse(null);
        String typeLabel = type != null ? type.getDisplayName() : "Room";

        return new FacilityResponse(
                resource.getId(),
                resource.getName(),
            typeLabel,
                resource.getCapacity(),
                resource.isActive() ? "Available" : "Unavailable",
                resource.getLocation(),
                resource.getCode()
        );
    }
}
