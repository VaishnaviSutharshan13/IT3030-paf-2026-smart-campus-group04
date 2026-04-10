package com.smartcampus.operationshub.modules.incidents.service;

import com.smartcampus.operationshub.modules.incidents.dto.AssignIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.CreateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentPriorityRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentStatusRequest;
import java.util.List;

public interface IncidentService {

    IncidentResponse reportIssue(CreateIncidentRequest request, Long lecturerUserId);

    List<IncidentResponse> listIncidents(
            Long currentUserId,
            boolean isAdmin,
            boolean isTechnician,
            String status,
            String priority,
            String locationType
    );

    IncidentResponse assignIncident(Long incidentId, AssignIncidentRequest request, Long adminUserId);

    IncidentResponse updatePriority(Long incidentId, UpdateIncidentPriorityRequest request, Long adminUserId);

    IncidentResponse updateStatus(
            Long incidentId,
            UpdateIncidentStatusRequest request,
            Long actorUserId,
            boolean isAdmin,
            boolean isTechnician
    );
}
