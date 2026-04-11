package com.smartcampus.operationshub.modules.bookings.controller;

import com.smartcampus.operationshub.modules.bookings.dto.BookingResponse;
import com.smartcampus.operationshub.modules.bookings.dto.CreateBookingRequest;
import com.smartcampus.operationshub.modules.bookings.dto.UpdateBookingRequest;
import com.smartcampus.operationshub.modules.bookings.dto.UpdateBookingStatusRequest;
import com.smartcampus.operationshub.modules.bookings.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping({"/api/v1/bookings", "/api/bookings"})
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            Authentication authentication
    ) {
        Long requesterUserId = parseUserId(authentication);
        BookingResponse response = bookingService.createBooking(request, requesterUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<BookingResponse> listBookings() {
        return bookingService.listBookings();
    }

    @PutMapping("/{bookingId}/approve")
    public BookingResponse approveBooking(@PathVariable Long bookingId, Authentication authentication) {
        Long adminUserId = parseUserId(authentication);
        return bookingService.approveBooking(bookingId, adminUserId);
    }

    @PutMapping("/{bookingId}/reject")
    public BookingResponse rejectBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateBookingStatusRequest request,
            Authentication authentication
    ) {
        Long adminUserId = parseUserId(authentication);
        return bookingService.rejectBooking(bookingId, request.getReason(), adminUserId);
    }

    @PatchMapping("/{bookingId}/status")
    public BookingResponse updateBookingStatus(
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateBookingStatusRequest request,
            Authentication authentication
    ) {
        Long adminUserId = parseUserId(authentication);
        return bookingService.updateStatus(bookingId, request, adminUserId);
    }

    @PutMapping("/{bookingId}/cancel")
    public BookingResponse cancelBooking(@PathVariable Long bookingId, Authentication authentication) {
        Long actorUserId = parseUserId(authentication);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return bookingService.cancelBooking(bookingId, actorUserId, isAdmin);
    }

    @PutMapping("/{bookingId}")
    public BookingResponse updateBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateBookingRequest request,
            Authentication authentication
    ) {
        Long actorUserId = parseUserId(authentication);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return bookingService.updateBooking(bookingId, request, actorUserId, isAdmin);
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long bookingId, Authentication authentication) {
        Long actorUserId = parseUserId(authentication);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        bookingService.deleteBooking(bookingId, actorUserId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bookingId}")
    public BookingResponse getBooking(@PathVariable Long bookingId) {
        return bookingService.getById(bookingId);
    }

    private Long parseUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.smartcampus.operationshub.security.oauth2.AppUserPrincipal appUserPrincipal) {
            return appUserPrincipal.getId();
        }
        throw new IllegalStateException("Cannot extract authenticated user id");
    }
}
