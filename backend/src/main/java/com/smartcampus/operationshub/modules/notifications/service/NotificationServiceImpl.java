package com.smartcampus.operationshub.modules.notifications.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.notifications.dto.NotificationResponse;
import com.smartcampus.operationshub.modules.notifications.entity.Notification;
import com.smartcampus.operationshub.modules.notifications.repository.NotificationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public List<NotificationResponse> listForRecipient(Long recipientUserId) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(recipientUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public NotificationResponse markRead(Long notificationId, Long recipientUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!recipientUserId.equals(notification.getRecipientUserId())) {
            throw new BusinessRuleException("You can only update your own notifications");
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public void markAllRead(Long recipientUserId) {
        List<Notification> notifications = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(recipientUserId);
        LocalDateTime now = LocalDateTime.now();
        for (Notification notification : notifications) {
            notification.setRead(true);
            notification.setReadAt(now);
        }
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
