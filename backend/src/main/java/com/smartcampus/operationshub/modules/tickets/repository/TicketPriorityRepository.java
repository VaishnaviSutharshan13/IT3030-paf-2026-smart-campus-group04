package com.smartcampus.operationshub.modules.tickets.repository;

import com.smartcampus.operationshub.modules.tickets.entity.TicketPriority;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketPriorityRepository extends JpaRepository<TicketPriority, Long> {

    Optional<TicketPriority> findByCode(String code);
}
