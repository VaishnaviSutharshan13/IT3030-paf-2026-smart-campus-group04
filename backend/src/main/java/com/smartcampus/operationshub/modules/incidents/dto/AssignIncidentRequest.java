package com.smartcampus.operationshub.modules.incidents.dto;

import jakarta.validation.constraints.NotNull;

public class AssignIncidentRequest {

    @NotNull
    private Long technicianUserId;

    private String priority;

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
