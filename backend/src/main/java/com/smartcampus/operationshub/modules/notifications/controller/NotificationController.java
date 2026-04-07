package com.smartcampus.operationshub.modules.notifications.controller;

import com.smartcampus.operationshub.modules.notifications.dto.NotificationResponse;
import com.smartcampus.operationshub.modules.notifications.service.NotificationService;
import com.smartcampus.operationshub.security.oauth2.AppUserPrincipal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list(Authentication authentication) {
        return notificationService.listForRecipient(parseUserId(authentication));
    }

    @PostMapping("/{notificationId}/read")
    public NotificationResponse markRead(@PathVariable Long notificationId, Authentication authentication) {
        return notificationService.markRead(notificationId, parseUserId(authentication));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(parseUserId(authentication));
        return ResponseEntity.noContent().build();
    }

    private Long parseUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserPrincipal appUserPrincipal) {
            return appUserPrincipal.getId();
        }
        throw new IllegalStateException("Cannot extract authenticated user id");
    }
}
