package com.smartcampus.operationshub.modules.facilities.dto;

public record FacilityResponse(
        Long id,
        String name,
        String type,
        Integer capacity,
        String availabilityStatus,
        String location,
        String code
) {
}
