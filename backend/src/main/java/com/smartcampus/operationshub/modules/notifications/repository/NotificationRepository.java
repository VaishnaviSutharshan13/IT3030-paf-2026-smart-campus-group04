package com.smartcampus.operationshub.modules.notifications.repository;

import com.smartcampus.operationshub.modules.notifications.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);
}
