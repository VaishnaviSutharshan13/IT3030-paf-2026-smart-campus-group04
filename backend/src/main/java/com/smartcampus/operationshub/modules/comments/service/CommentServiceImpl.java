package com.smartcampus.operationshub.modules.comments.service;

import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.comments.dto.CommentResponse;
import com.smartcampus.operationshub.modules.comments.entity.Comment;
import com.smartcampus.operationshub.modules.comments.repository.CommentRepository;
import com.smartcampus.operationshub.modules.tickets.entity.Ticket;
import com.smartcampus.operationshub.modules.tickets.repository.TicketRepository;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    public CommentServiceImpl(CommentRepository commentRepository, TicketRepository ticketRepository) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public CommentResponse addTicketComment(Long ticketId, Long authorUserId, String body) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        Comment comment = new Comment();
        comment.setTicket(ticket);
        comment.setAuthorUserId(authorUserId);
        comment.setBody(body.trim());

        Comment saved = commentRepository.save(comment);
        return new CommentResponse(saved.getId(), ticketId, saved.getAuthorUserId(), saved.getBody(), saved.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public List<CommentResponse> listTicketComments(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(c -> new CommentResponse(c.getId(), c.getTicket().getId(), c.getAuthorUserId(), c.getBody(), c.getCreatedAt()))
                .toList();
    }
}
