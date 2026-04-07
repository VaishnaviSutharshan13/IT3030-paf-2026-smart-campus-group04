package com.smartcampus.operationshub.modules.resources.repository;

import com.smartcampus.operationshub.modules.resources.entity.ResourceType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceTypeRepository extends JpaRepository<ResourceType, Long> {

    Optional<ResourceType> findByCode(String code);
}
