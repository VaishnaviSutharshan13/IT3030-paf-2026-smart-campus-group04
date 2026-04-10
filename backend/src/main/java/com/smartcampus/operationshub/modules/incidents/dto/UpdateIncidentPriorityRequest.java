package com.smartcampus.operationshub.modules.incidents.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateIncidentPriorityRequest {

    @NotBlank
    private String priority;

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
