package com.smartcampus.operationshub.modules.facilities.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class FacilityRequest {

    @Size(max = 120)
    private String name;

    @Size(max = 32)
    private String type;

    @Min(1)
    private Integer capacity;

    @Size(max = 32)
    private String availabilityStatus;

    @Size(max = 120)
    private String location;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
