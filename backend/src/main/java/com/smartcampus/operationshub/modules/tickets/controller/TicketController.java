package com.smartcampus.operationshub.modules.tickets.controller;

import com.smartcampus.operationshub.modules.tickets.dto.AssignTechnicianRequest;
import com.smartcampus.operationshub.modules.tickets.dto.CreateTicketRequest;
import com.smartcampus.operationshub.modules.tickets.dto.TicketResponse;
import com.smartcampus.operationshub.modules.tickets.dto.UpdateTicketRequest;
import com.smartcampus.operationshub.modules.tickets.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication
    ) {
        Long reporterUserId = parseUserId(authentication);
        TicketResponse response = ticketService.createTicket(request, reporterUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{ticketId}")
    public TicketResponse updateTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody UpdateTicketRequest request,
            Authentication authentication
    ) {
        Long actorUserId = parseUserId(authentication);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ticketService.updateTicket(ticketId, request, actorUserId, isAdmin);
    }

    @PutMapping("/{ticketId}/assign")
    public TicketResponse assignTechnician(
            @PathVariable Long ticketId,
            @Valid @RequestBody AssignTechnicianRequest request
    ) {
        return ticketService.assignTechnician(ticketId, request.getTechnicianUserId());
    }

    @PutMapping("/{ticketId}/start-progress")
    public TicketResponse startProgress(@PathVariable Long ticketId) {
        return ticketService.startProgress(ticketId);
    }

    @PutMapping("/{ticketId}/resolve")
    public TicketResponse resolveTicket(@PathVariable Long ticketId) {
        return ticketService.resolveTicket(ticketId);
    }

    @PutMapping("/{ticketId}/close")
    public TicketResponse closeTicket(@PathVariable Long ticketId) {
        return ticketService.closeTicket(ticketId);
    }

    @GetMapping("/{ticketId}")
    public TicketResponse getTicket(@PathVariable Long ticketId) {
        return ticketService.getTicket(ticketId);
    }

    @GetMapping
    public List<TicketResponse> listTickets() {
        return ticketService.listTickets();
    }

    @DeleteMapping("/{ticketId}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long ticketId, Authentication authentication) {
        Long actorUserId = parseUserId(authentication);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        ticketService.deleteTicket(ticketId, actorUserId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    private Long parseUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.smartcampus.operationshub.security.oauth2.AppUserPrincipal appUserPrincipal) {
            return appUserPrincipal.getId();
        }
        throw new IllegalStateException("Cannot extract authenticated user id");
    }
}
