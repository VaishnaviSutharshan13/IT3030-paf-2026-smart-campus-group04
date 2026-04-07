package com.smartcampus.operationshub.modules.admin.service;

import com.smartcampus.operationshub.modules.admin.dto.AdminOverviewResponse;
import com.smartcampus.operationshub.modules.admin.dto.AdminUserResponse;
import java.util.List;

public interface AdminService {

    List<AdminUserResponse> listUsers();

    AdminUserResponse updateUserRole(Long userId, String roleCode);

    AdminOverviewResponse getOverview();
}
