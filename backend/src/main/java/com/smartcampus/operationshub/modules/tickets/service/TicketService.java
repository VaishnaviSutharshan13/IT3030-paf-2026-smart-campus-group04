package com.smartcampus.operationshub.modules.tickets.service;

import com.smartcampus.operationshub.modules.tickets.dto.CreateTicketRequest;
import com.smartcampus.operationshub.modules.tickets.dto.TicketResponse;
import com.smartcampus.operationshub.modules.tickets.dto.UpdateTicketRequest;
import java.util.List;

public interface TicketService {

    TicketResponse createTicket(CreateTicketRequest request, Long reporterUserId);

    TicketResponse updateTicket(Long ticketId, UpdateTicketRequest request, Long actorUserId, boolean isAdmin);

    TicketResponse assignTechnician(Long ticketId, Long technicianUserId);

    TicketResponse startProgress(Long ticketId);

    TicketResponse resolveTicket(Long ticketId);

    TicketResponse closeTicket(Long ticketId);

    TicketResponse getTicket(Long ticketId);

    List<TicketResponse> listTickets();

    void deleteTicket(Long ticketId, Long actorUserId, boolean isAdmin);
}
