package com.smartcampus.operationshub.modules.tickets.dto;

import jakarta.validation.constraints.NotNull;

public class AssignTechnicianRequest {

    @NotNull
    private Long technicianUserId;

    public Long getTechnicianUserId() {
        return technicianUserId;
    }

    public void setTechnicianUserId(Long technicianUserId) {
        this.technicianUserId = technicianUserId;
    }
}
