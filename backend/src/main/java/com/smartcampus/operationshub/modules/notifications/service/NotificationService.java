package com.smartcampus.operationshub.modules.notifications.service;

import com.smartcampus.operationshub.modules.notifications.dto.NotificationResponse;
import java.util.List;

public interface NotificationService {

    List<NotificationResponse> listForRecipient(Long recipientUserId);

    NotificationResponse markRead(Long notificationId, Long recipientUserId);

    void markAllRead(Long recipientUserId);

    void createNotification(Long recipientUserId, Long actorUserId, String typeCode, String title, String message);
}
