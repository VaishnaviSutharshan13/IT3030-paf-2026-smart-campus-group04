package com.smartcampus.operationshub.modules.incidents.repository;

import com.smartcampus.operationshub.modules.incidents.entity.Incident;
import com.smartcampus.operationshub.modules.incidents.entity.IncidentPriority;
import com.smartcampus.operationshub.modules.incidents.entity.IncidentStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    @Query("""
        select i from Incident i
        where (:reporterId is null or i.reportedBy = :reporterId)
          and (:assigneeId is null or i.assignedTo = :assigneeId)
          and (:status is null or i.status = :status)
          and (:priority is null or i.priority = :priority)
          and (:locationType is null or upper(i.locationType) = :locationType)
        order by i.createdAt desc
    """)
    List<Incident> findByFilters(
            @Param("reporterId") Long reporterId,
            @Param("assigneeId") Long assigneeId,
            @Param("status") IncidentStatus status,
            @Param("priority") IncidentPriority priority,
            @Param("locationType") String locationType
    );
}
