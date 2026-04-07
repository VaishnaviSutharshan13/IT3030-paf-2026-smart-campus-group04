package com.smartcampus.operationshub.modules.tickets.repository;

import com.smartcampus.operationshub.modules.tickets.entity.TicketImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketImageRepository extends JpaRepository<TicketImage, Long> {

    List<TicketImage> findByTicketId(Long ticketId);
}
