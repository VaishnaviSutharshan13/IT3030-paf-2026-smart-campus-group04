package com.smartcampus.operationshub.modules.resources.repository;

import com.smartcampus.operationshub.modules.resources.entity.Resource;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByActiveTrueOrderByNameAsc();

    Optional<Resource> findByCode(String code);
}
