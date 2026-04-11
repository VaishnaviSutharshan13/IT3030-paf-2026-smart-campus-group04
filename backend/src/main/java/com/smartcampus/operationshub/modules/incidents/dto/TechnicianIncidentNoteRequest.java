package com.smartcampus.operationshub.modules.incidents.dto;

import jakarta.validation.constraints.NotBlank;

public class TechnicianIncidentNoteRequest {

    @NotBlank(message = "Note is required")
    private String note;

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
