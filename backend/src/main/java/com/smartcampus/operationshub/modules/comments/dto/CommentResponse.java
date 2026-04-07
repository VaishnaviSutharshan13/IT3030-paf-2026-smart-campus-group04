package com.smartcampus.operationshub.modules.comments.dto;

import java.time.LocalDateTime;

public record CommentResponse(Long id, Long ticketId, Long authorUserId, String body, LocalDateTime createdAt) {
}
