package com.smartcampus.operationshub.modules.resources.service;

import com.smartcampus.operationshub.modules.resources.dto.ResourceRequest;
import com.smartcampus.operationshub.modules.resources.dto.ResourceResponse;
import java.util.List;

public interface ResourceService {

    List<ResourceResponse> listResources();

    ResourceResponse getResource(Long id);

    ResourceResponse createResource(ResourceRequest request, Long actorUserId);

    ResourceResponse updateResource(Long id, ResourceRequest request);

    void deleteResource(Long id);
}
