package com.smartcampus.operationshub.modules.comments.service;

import com.smartcampus.operationshub.modules.comments.dto.CommentResponse;
import java.util.List;

public interface CommentService {

    CommentResponse addTicketComment(Long ticketId, Long authorUserId, String body);

    List<CommentResponse> listTicketComments(Long ticketId);
}
