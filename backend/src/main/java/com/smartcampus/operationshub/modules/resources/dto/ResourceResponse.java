package com.smartcampus.operationshub.modules.resources.dto;

public record ResourceResponse(
        Long id,
        String typeCode,
        String code,
        String name,
        String location,
        Integer capacity,
        String description,
        boolean active
) {
}
