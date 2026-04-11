package com.smartcampus.operationshub.modules.bookings.service;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.common.exception.ConflictException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.bookings.dto.BookingResponse;
import com.smartcampus.operationshub.modules.bookings.dto.CreateBookingRequest;
import com.smartcampus.operationshub.modules.bookings.dto.UpdateBookingRequest;
import com.smartcampus.operationshub.modules.bookings.dto.UpdateBookingStatusRequest;
import com.smartcampus.operationshub.modules.bookings.entity.Booking;
import com.smartcampus.operationshub.modules.bookings.entity.BookingStatus;
import com.smartcampus.operationshub.modules.bookings.repository.BookingRepository;
import com.smartcampus.operationshub.modules.bookings.workflow.BookingWorkflowValidator;
import java.util.EnumSet;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final EnumSet<BookingStatus> BLOCKING_STATUSES =
            EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;

    public BookingServiceImpl(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public BookingResponse createBooking(CreateBookingRequest request, Long requesterUserId) {
        validateNoConflict(request.getResourceId(), request.getStartAt(), request.getEndAt());

        Booking booking = new Booking();
        booking.setRequesterUserId(requesterUserId);
        booking.setResourceId(request.getResourceId());
        booking.setStartAt(request.getStartAt());
        booking.setEndAt(request.getEndAt());
        booking.setPurpose(request.getPurpose().trim());
        booking.setStatus(BookingStatus.PENDING);

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public List<BookingResponse> listBookings() {
        return bookingRepository.findAllByOrderByStartAtDesc().stream().map(this::toResponse).toList();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponse approveBooking(Long bookingId, Long adminUserId) {
        Booking booking = loadBooking(bookingId);
        BookingWorkflowValidator.assertTransition(booking.getStatus(), BookingStatus.APPROVED);

        validateNoConflict(booking.getId(), booking.getResourceId(), booking.getStartAt(), booking.getEndAt());

        booking.setStatus(BookingStatus.APPROVED);
        booking.setApprovedByUserId(adminUserId);
        booking.setRejectionReason(null);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponse rejectBooking(Long bookingId, String reason, Long adminUserId) {
        Booking booking = loadBooking(bookingId);
        BookingWorkflowValidator.assertTransition(booking.getStatus(), BookingStatus.REJECTED);

        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("Rejection reason is required");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setApprovedByUserId(adminUserId);
        booking.setRejectionReason(reason.trim());
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponse updateStatus(Long bookingId, UpdateBookingStatusRequest request, Long adminUserId) {
        String normalized = request.getStatus() == null ? "" : request.getStatus().trim().toUpperCase();
        if (!"APPROVED".equals(normalized) && !"REJECTED".equals(normalized)) {
            throw new BusinessRuleException("Invalid status. Allowed values: Approved, Rejected");
        }

        if ("APPROVED".equals(normalized)) {
            return approveBooking(bookingId, adminUserId);
        }

        return rejectBooking(bookingId, request.getReason(), adminUserId);
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public BookingResponse cancelBooking(Long bookingId, Long actorUserId, boolean isAdmin) {
        Booking booking = loadBooking(bookingId);

        if (!isAdmin && !actorUserId.equals(booking.getRequesterUserId())) {
            throw new BusinessRuleException("Only requester or admin can cancel this booking");
        }

        BookingWorkflowValidator.assertTransition(booking.getStatus(), BookingStatus.CANCELLED);

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledByUserId(actorUserId);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public BookingResponse updateBooking(Long bookingId, UpdateBookingRequest request, Long actorUserId, boolean isAdmin) {
        Booking booking = loadBooking(bookingId);

        if (!isAdmin && !actorUserId.equals(booking.getRequesterUserId())) {
            throw new BusinessRuleException("Only requester or admin can update this booking");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BusinessRuleException("Only pending bookings can be edited");
        }

        validateNoConflict(booking.getId(), request.getResourceId(), request.getStartAt(), request.getEndAt());

        booking.setResourceId(request.getResourceId());
        booking.setStartAt(request.getStartAt());
        booking.setEndAt(request.getEndAt());
        booking.setPurpose(request.getPurpose().trim());
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public void deleteBooking(Long bookingId, Long actorUserId, boolean isAdmin) {
        Booking booking = loadBooking(bookingId);

        if (!isAdmin && !actorUserId.equals(booking.getRequesterUserId())) {
            throw new BusinessRuleException("Only requester or admin can delete this booking");
        }

        if (isAdmin && booking.getStatus() != BookingStatus.APPROVED) {
            throw new BusinessRuleException("Admin can delete only approved bookings.");
        }

        if (!isAdmin && booking.getStatus() == BookingStatus.APPROVED) {
            throw new BusinessRuleException("Approved bookings cannot be deleted.");
        }

        bookingRepository.delete(booking);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public BookingResponse getById(Long bookingId) {
        return toResponse(loadBooking(bookingId));
    }

    private Booking loadBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    }

    private void validateNoConflict(Long resourceId, java.time.LocalDateTime startAt, java.time.LocalDateTime endAt) {
        boolean hasConflict = bookingRepository.existsByResourceIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
                resourceId,
                BLOCKING_STATUSES,
                endAt,
                startAt
        );

        if (hasConflict) {
            throw new ConflictException("Resource is already booked for the selected time range");
        }
    }

    private void validateNoConflict(Long bookingId, Long resourceId, java.time.LocalDateTime startAt, java.time.LocalDateTime endAt) {
        boolean hasConflict = bookingRepository.existsByIdNotAndResourceIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
                bookingId,
                resourceId,
                BLOCKING_STATUSES,
                endAt,
                startAt
        );

        if (hasConflict) {
            throw new ConflictException("Resource is already booked for the selected time range");
        }
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.of(
                booking.getId(),
                booking.getRequesterUserId(),
                booking.getResourceId(),
                booking.getStatus(),
                booking.getStartAt(),
                booking.getEndAt(),
                booking.getPurpose(),
                booking.getRejectionReason()
        );
    }
}
