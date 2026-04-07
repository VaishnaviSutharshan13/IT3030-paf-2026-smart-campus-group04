package com.smartcampus.operationshub.modules.tickets.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.tickets.dto.CreateTicketRequest;
import com.smartcampus.operationshub.modules.tickets.dto.TicketResponse;
import com.smartcampus.operationshub.modules.tickets.dto.UpdateTicketRequest;
import com.smartcampus.operationshub.modules.tickets.entity.Ticket;
import com.smartcampus.operationshub.modules.tickets.entity.TicketImage;
import com.smartcampus.operationshub.modules.tickets.entity.TicketPriority;
import com.smartcampus.operationshub.modules.tickets.entity.TicketStatus;
import com.smartcampus.operationshub.modules.tickets.entity.TicketStatusCode;
import com.smartcampus.operationshub.modules.tickets.repository.TicketImageRepository;
import com.smartcampus.operationshub.modules.tickets.repository.TicketPriorityRepository;
import com.smartcampus.operationshub.modules.tickets.repository.TicketRepository;
import com.smartcampus.operationshub.modules.tickets.repository.TicketStatusRepository;
import com.smartcampus.operationshub.modules.tickets.workflow.TicketWorkflowValidator;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final TicketPriorityRepository ticketPriorityRepository;
    private final TicketStatusRepository ticketStatusRepository;
    private final TicketImageRepository ticketImageRepository;

    public TicketServiceImpl(
            TicketRepository ticketRepository,
            TicketPriorityRepository ticketPriorityRepository,
            TicketStatusRepository ticketStatusRepository,
            TicketImageRepository ticketImageRepository
    ) {
        this.ticketRepository = ticketRepository;
        this.ticketPriorityRepository = ticketPriorityRepository;
        this.ticketStatusRepository = ticketStatusRepository;
        this.ticketImageRepository = ticketImageRepository;
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public TicketResponse createTicket(CreateTicketRequest request, Long reporterUserId) {
        TicketPriority priority = ticketPriorityRepository.findByCode(request.getPriority().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket priority not found: " + request.getPriority()));
        TicketStatus openStatus = getStatus(TicketStatusCode.OPEN);

        Ticket ticket = new Ticket();
        ticket.setReporterUserId(reporterUserId);
        ticket.setPriority(priority);
        ticket.setStatus(openStatus);
        ticket.setResourceId(request.getResourceId());
        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setIncidentAt(request.getIncidentAt());

        Ticket saved = ticketRepository.save(ticket);
        storeImages(saved, request.getImageUrls(), reporterUserId);

        return toResponse(saved);
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public TicketResponse updateTicket(Long ticketId, UpdateTicketRequest request, Long actorUserId, boolean isAdmin) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (!isAdmin && !actorUserId.equals(ticket.getReporterUserId())) {
            throw new BusinessRuleException("Only the reporter or an admin can update this ticket");
        }

        TicketPriority priority = ticketPriorityRepository.findByCode(request.getPriority().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket priority not found: " + request.getPriority()));

        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(priority);
        ticket.setResourceId(request.getResourceId());
        return toResponse(ticketRepository.save(ticket));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse assignTechnician(Long ticketId, Long technicianUserId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        ticket.setAssignedTechnicianUserId(technicianUserId);
        return toResponse(ticketRepository.save(ticket));
    }

    @Override
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public TicketResponse startProgress(Long ticketId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        transition(ticket, TicketStatusCode.IN_PROGRESS);
        return toResponse(ticketRepository.save(ticket));
    }

    @Override
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public TicketResponse resolveTicket(Long ticketId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        transition(ticket, TicketStatusCode.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        return toResponse(ticketRepository.save(ticket));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse closeTicket(Long ticketId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        transition(ticket, TicketStatusCode.CLOSED);
        return toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public TicketResponse getTicket(Long ticketId) {
        return toResponse(getTicketOrThrow(ticketId));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public List<TicketResponse> listTickets() {
        return ticketRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public void deleteTicket(Long ticketId, Long actorUserId, boolean isAdmin) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (!isAdmin && !actorUserId.equals(ticket.getReporterUserId())) {
            throw new BusinessRuleException("Only the reporter or an admin can delete this ticket");
        }
        ticketImageRepository.deleteAll(ticketImageRepository.findByTicketId(ticketId));
        ticketRepository.delete(ticket);
    }

    private void transition(Ticket ticket, TicketStatusCode target) {
        TicketStatusCode current = TicketStatusCode.valueOf(ticket.getStatus().getCode());
        TicketWorkflowValidator.assertTransition(current, target);
        ticket.setStatus(getStatus(target));
    }

    private Ticket getTicketOrThrow(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));
    }

    private TicketStatus getStatus(TicketStatusCode code) {
        return ticketStatusRepository.findByCode(code.name())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket status not found: " + code.name()));
    }

    private void storeImages(Ticket ticket, List<String> imageUrls, Long uploadedByUserId) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }

        for (String imageUrl : imageUrls) {
            if (imageUrl == null || imageUrl.isBlank()) {
                throw new BusinessRuleException("Image URL cannot be blank");
            }
            TicketImage image = new TicketImage();
            image.setTicket(ticket);
            image.setImageUrl(imageUrl.trim());
            image.setUploadedByUserId(uploadedByUserId);
            ticketImageRepository.save(image);
        }
    }

    private TicketResponse toResponse(Ticket ticket) {
        List<String> imageUrls = ticketImageRepository.findByTicketId(ticket.getId()).stream()
                .map(TicketImage::getImageUrl)
                .toList();

        return new TicketResponse(
                ticket.getId(),
                ticket.getReporterUserId(),
                ticket.getAssignedTechnicianUserId(),
                ticket.getResourceId(),
                ticket.getStatus().getCode(),
                ticket.getPriority().getCode(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getIncidentAt(),
                ticket.getResolvedAt(),
                imageUrls
        );
    }
}
