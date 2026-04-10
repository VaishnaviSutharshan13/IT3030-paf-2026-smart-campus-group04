package com.smartcampus.operationshub.modules.courses.dto;

public record CourseResponse(
        Long id,
        String code,
        String title,
        String description,
        String lecturer
) {
}
