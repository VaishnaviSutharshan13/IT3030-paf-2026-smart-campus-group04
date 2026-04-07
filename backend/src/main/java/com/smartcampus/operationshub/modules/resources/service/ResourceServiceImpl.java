package com.smartcampus.operationshub.modules.resources.service;

import com.smartcampus.operationshub.common.exception.ConflictException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.resources.dto.ResourceRequest;
import com.smartcampus.operationshub.modules.resources.dto.ResourceResponse;
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
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceTypeRepository resourceTypeRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository, ResourceTypeRepository resourceTypeRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceTypeRepository = resourceTypeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public List<ResourceResponse> listResources() {
        return resourceRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public ResourceResponse getResource(Long id) {
        return toResponse(getResourceOrThrow(id));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse createResource(ResourceRequest request, Long actorUserId) {
        resourceRepository.findByCode(request.getCode().trim())
                .ifPresent(existing -> {
                    throw new ConflictException("Resource code already exists");
                });

        ResourceType type = getResourceTypeOrThrow(request.getTypeCode());
        Resource resource = new Resource();
        apply(resource, request, type);
        resource.setCreatedBy(actorUserId);
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse updateResource(Long id, ResourceRequest request) {
        Resource resource = getResourceOrThrow(id);
        ResourceType type = getResourceTypeOrThrow(request.getTypeCode());

        if (!resource.getCode().equalsIgnoreCase(request.getCode().trim())) {
            resourceRepository.findByCode(request.getCode().trim())
                    .ifPresent(existing -> {
                        throw new ConflictException("Resource code already exists");
                    });
        }

        apply(resource, request, type);
        return toResponse(resourceRepository.save(resource));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteResource(Long id) {
        Resource resource = getResourceOrThrow(id);
        resource.setActive(false);
        resourceRepository.save(resource);
    }

    private void apply(Resource resource, ResourceRequest request, ResourceType type) {
        resource.setResourceTypeId(type.getId());
        resource.setCode(request.getCode().trim());
        resource.setName(request.getName().trim());
        resource.setLocation(request.getLocation().trim());
        resource.setCapacity(request.getCapacity());
        resource.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        resource.setActive(Boolean.TRUE.equals(request.getActive()));
    }

    private Resource getResourceOrThrow(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));
    }

    private ResourceType getResourceTypeOrThrow(String typeCode) {
        return resourceTypeRepository.findByCode(typeCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + typeCode));
    }

    private ResourceResponse toResponse(Resource resource) {
        String typeCode = resourceTypeRepository.findById(resource.getResourceTypeId())
                .map(ResourceType::getCode)
                .orElse("UNKNOWN");

        return new ResourceResponse(
                resource.getId(),
                typeCode,
                resource.getCode(),
                resource.getName(),
                resource.getLocation(),
                resource.getCapacity(),
                resource.getDescription(),
                resource.isActive()
        );
    }
}
