package com.smartcampus.operationshub.modules.admin.service;

import com.smartcampus.operationshub.modules.admin.dto.AdminOverviewResponse;
import com.smartcampus.operationshub.modules.admin.dto.AdminUserResponse;
import java.util.List;

public interface AdminService {

    AdminUserResponse createUser(String fullName, String email, String password, String roleCode);

    List<AdminUserResponse> listUsers();

    AdminUserResponse updateUser(Long userId, String roleCode, String status);

    AdminUserResponse updateUserRole(Long userId, String roleCode);

    void deleteUser(Long userId);

    AdminOverviewResponse getOverview();
}
