package com.smartcampus.operationshub.modules.admin.dto;

public class UpdateAdminUserRequest {

    private String role;

    private String status;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}