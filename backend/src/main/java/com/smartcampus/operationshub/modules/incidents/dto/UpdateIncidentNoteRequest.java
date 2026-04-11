package com.smartcampus.operationshub.modules.incidents.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class UpdateIncidentNoteRequest {

    @NotBlank(message = "Note is required")
    @JsonAlias({"notes", "comment"})
    private String note;

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
