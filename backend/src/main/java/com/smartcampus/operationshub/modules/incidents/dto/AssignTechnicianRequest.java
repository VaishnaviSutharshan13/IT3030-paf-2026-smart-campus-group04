package com.smartcampus.operationshub.modules.incidents.dto;

import jakarta.validation.constraints.NotNull;

public class AssignTechnicianRequest {

    @NotNull
    private Long incidentId;

    @NotNull
    private Long technicianUserId;

    private String priority;

    public Long getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(Long incidentId) {
        this.incidentId = incidentId;
    }

    public Long getTechnicianUserId() {
        return technicianUserId;
    }

    public void setTechnicianUserId(Long technicianUserId) {
        this.technicianUserId = technicianUserId;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
