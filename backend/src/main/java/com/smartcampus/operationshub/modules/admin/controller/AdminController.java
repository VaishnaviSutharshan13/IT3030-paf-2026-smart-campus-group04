package com.smartcampus.operationshub.modules.admin.controller;

import com.smartcampus.operationshub.modules.admin.dto.AdminOverviewResponse;
import com.smartcampus.operationshub.modules.admin.dto.AdminUserResponse;
import com.smartcampus.operationshub.modules.admin.dto.CreateAdminUserRequest;
import com.smartcampus.operationshub.modules.admin.dto.UpdateAdminUserRequest;
import com.smartcampus.operationshub.modules.admin.dto.UpdateUserRoleRequest;
import com.smartcampus.operationshub.modules.admin.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public AdminOverviewResponse getOverview() {
        return adminService.getOverview();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> listUsers() {
        return adminService.listUsers();
    }

    @PostMapping("/users")
    public AdminUserResponse createUser(@Valid @RequestBody CreateAdminUserRequest request) {
        return adminService.createUser(
                request.getResolvedName(),
                request.getEmail(),
                request.getPassword(),
                request.getRole()
        );
    }

    @PatchMapping("/users/{userId}")
    public AdminUserResponse updateUser(
            @PathVariable Long userId,
            @RequestBody UpdateAdminUserRequest request
    ) {
        return adminService.updateUser(userId, request.getRole(), request.getStatus());
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{userId}/role")
    public AdminUserResponse updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return adminService.updateUserRole(userId, request.getRole());
    }
}
