package com.smartcampus.operationshub.modules.comments.repository;

import com.smartcampus.operationshub.modules.comments.entity.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
