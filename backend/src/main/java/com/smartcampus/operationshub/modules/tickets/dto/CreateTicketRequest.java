package com.smartcampus.operationshub.modules.tickets.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public class CreateTicketRequest {

    @NotBlank
    @Size(max = 180)
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String priority;

    private Long resourceId;

    private LocalDateTime incidentAt;

    private List<@Size(max = 500) String> imageUrls;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public LocalDateTime getIncidentAt() {
        return incidentAt;
    }

    public void setIncidentAt(LocalDateTime incidentAt) {
        this.incidentAt = incidentAt;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}
