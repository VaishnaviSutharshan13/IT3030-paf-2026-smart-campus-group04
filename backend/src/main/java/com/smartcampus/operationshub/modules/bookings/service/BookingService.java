package com.smartcampus.operationshub.modules.bookings.service;

import com.smartcampus.operationshub.modules.bookings.dto.BookingResponse;
import com.smartcampus.operationshub.modules.bookings.dto.CreateBookingRequest;
import com.smartcampus.operationshub.modules.bookings.dto.UpdateBookingRequest;
import com.smartcampus.operationshub.modules.bookings.dto.UpdateBookingStatusRequest;
import java.util.List;

public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request, Long requesterUserId);

    List<BookingResponse> listBookings();

    BookingResponse approveBooking(Long bookingId, Long adminUserId);

    BookingResponse rejectBooking(Long bookingId, String reason, Long adminUserId);

    BookingResponse updateStatus(Long bookingId, UpdateBookingStatusRequest request, Long adminUserId);

    BookingResponse cancelBooking(Long bookingId, Long actorUserId, boolean isAdmin);

    BookingResponse updateBooking(Long bookingId, UpdateBookingRequest request, Long actorUserId, boolean isAdmin);

    void deleteBooking(Long bookingId, Long actorUserId, boolean isAdmin);

    BookingResponse getById(Long bookingId);
}
