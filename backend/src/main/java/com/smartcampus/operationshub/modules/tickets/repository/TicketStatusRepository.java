package com.smartcampus.operationshub.modules.tickets.repository;

import com.smartcampus.operationshub.modules.tickets.entity.TicketStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketStatusRepository extends JpaRepository<TicketStatus, Long> {

    Optional<TicketStatus> findByCode(String code);
}
