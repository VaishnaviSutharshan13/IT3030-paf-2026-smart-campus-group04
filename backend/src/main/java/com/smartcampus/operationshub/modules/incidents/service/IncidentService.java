package com.smartcampus.operationshub.modules.incidents.service;

import com.smartcampus.operationshub.modules.incidents.dto.AssignIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.AssignTechnicianRequest;
import com.smartcampus.operationshub.modules.incidents.dto.CreateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.IncidentResponse;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentPriorityRequest;
import com.smartcampus.operationshub.modules.incidents.dto.UpdateIncidentStatusRequest;
import java.util.List;

public interface IncidentService {

    IncidentResponse reportIssue(CreateIncidentRequest request, Long lecturerUserId);

        IncidentResponse createTechnicianIncident(CreateIncidentRequest request, Long technicianUserId);

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

    IncidentResponse updateIncident(Long incidentId, UpdateIncidentRequest request, Long actorUserId, boolean isAdmin);

    IncidentResponse assignTechnician(AssignTechnicianRequest request, Long adminUserId);

    List<IncidentResponse> listAssignedIncidents(Long technicianUserId);

    void deleteIncident(Long incidentId, Long actorUserId, boolean isAdmin);
}
