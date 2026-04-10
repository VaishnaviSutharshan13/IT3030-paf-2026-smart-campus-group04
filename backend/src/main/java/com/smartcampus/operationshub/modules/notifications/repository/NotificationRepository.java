package com.smartcampus.operationshub.modules.notifications.repository;

import com.smartcampus.operationshub.modules.notifications.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);

    @Modifying
    @Query(value = """
        INSERT INTO notifications (
            recipient_user_id,
            actor_user_id,
            notification_type_id,
            title,
            message,
            is_read,
            created_at
        )
        VALUES (
            :recipientUserId,
            :actorUserId,
            COALESCE((SELECT id FROM notification_types WHERE code = :typeCode LIMIT 1),
                     (SELECT id FROM notification_types WHERE code = 'SYSTEM' LIMIT 1)),
            :title,
            :message,
            FALSE,
            CURRENT_TIMESTAMP
        )
    """, nativeQuery = true)
    void insertNotification(
            @Param("recipientUserId") Long recipientUserId,
            @Param("actorUserId") Long actorUserId,
            @Param("typeCode") String typeCode,
            @Param("title") String title,
            @Param("message") String message
    );
}
