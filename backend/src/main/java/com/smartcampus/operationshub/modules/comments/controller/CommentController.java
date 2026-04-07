package com.smartcampus.operationshub.modules.comments.controller;

import com.smartcampus.operationshub.modules.comments.dto.CommentResponse;
import com.smartcampus.operationshub.modules.comments.dto.CreateCommentRequest;
import com.smartcampus.operationshub.modules.comments.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        Long userId = parseUserId(authentication);
        CommentResponse response = commentService.addTicketComment(ticketId, userId, request.getBody());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<CommentResponse> listComments(@PathVariable Long ticketId) {
        return commentService.listTicketComments(ticketId);
    }

    private Long parseUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.smartcampus.operationshub.security.oauth2.AppUserPrincipal appUserPrincipal) {
            return appUserPrincipal.getId();
        }
        throw new IllegalStateException("Cannot extract authenticated user id");
    }
}
