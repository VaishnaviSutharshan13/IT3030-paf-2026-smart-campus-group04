package com.smartcampus.operationshub.modules.bookings.repository;

import com.smartcampus.operationshub.modules.bookings.entity.Booking;
import com.smartcampus.operationshub.modules.bookings.entity.BookingStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    java.util.List<Booking> findAllByOrderByStartAtDesc();

    long countByStatus(BookingStatus status);

    boolean existsByResourceIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
            Long resourceId,
            Collection<BookingStatus> statuses,
            LocalDateTime endAt,
            LocalDateTime startAt
    );

    boolean existsByIdNotAndResourceIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
            Long id,
            Long resourceId,
            Collection<BookingStatus> statuses,
            LocalDateTime endAt,
            LocalDateTime startAt
    );
}
