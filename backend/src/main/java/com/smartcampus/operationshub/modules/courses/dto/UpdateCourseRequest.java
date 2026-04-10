package com.smartcampus.operationshub.modules.courses.dto;

import jakarta.validation.constraints.Size;

public class UpdateCourseRequest {

    @Size(max = 32)
    private String code;

    @Size(max = 160)
    private String title;

    @Size(max = 2000)
    private String description;

    @Size(max = 120)
    private String lecturer;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

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

    public String getLecturer() {
        return lecturer;
    }

    public void setLecturer(String lecturer) {
        this.lecturer = lecturer;
    }
}
