package com.smartcampus.operationshub.modules.bookings.dto;

import com.smartcampus.operationshub.modules.bookings.entity.BookingStatus;
import java.time.LocalDateTime;

public class BookingResponse {

    private Long id;
    private Long requesterUserId;
    private Long resourceId;
    private BookingStatus status;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String purpose;
    private String rejectionReason;

    public static BookingResponse of(
            Long id,
            Long requesterUserId,
            Long resourceId,
            BookingStatus status,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String purpose,
            String rejectionReason
    ) {
        BookingResponse response = new BookingResponse();
        response.id = id;
        response.requesterUserId = requesterUserId;
        response.resourceId = resourceId;
        response.status = status;
        response.startAt = startAt;
        response.endAt = endAt;
        response.purpose = purpose;
        response.rejectionReason = rejectionReason;
        return response;
    }

    public Long getId() {
        return id;
    }

    public Long getRequesterUserId() {
        return requesterUserId;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public LocalDateTime getStartAt() {
        return startAt;
    }

    public LocalDateTime getEndAt() {
        return endAt;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }
}
