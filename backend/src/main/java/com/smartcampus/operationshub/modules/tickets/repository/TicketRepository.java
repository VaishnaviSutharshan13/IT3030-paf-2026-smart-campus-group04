package com.smartcampus.operationshub.modules.tickets.repository;

import com.smartcampus.operationshub.modules.tickets.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
}
