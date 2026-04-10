package com.smartcampus.operationshub.modules.incidents.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateIncidentRequest {

    @NotBlank
    @Size(max = 50)
    @JsonAlias({"locationType", "location_type", "roomType", "room_type"})
    private String locationType;

    @NotBlank
    @Size(max = 40)
    @JsonAlias({"floor", "floor_name"})
    private String floor;

    @NotBlank
    @Size(max = 50)
    @JsonAlias({"issueType", "issue_type", "category", "type"})
    private String issueType;

    @NotBlank
    @JsonAlias({"description", "details"})
    private String description;

    @NotBlank
    @JsonAlias({"priority", "level"})
    private String priority;

    public String getLocationType() {
        return locationType;
    }

    public void setLocationType(String locationType) {
        this.locationType = locationType;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getIssueType() {
        return issueType;
    }

    public void setIssueType(String issueType) {
        this.issueType = issueType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
