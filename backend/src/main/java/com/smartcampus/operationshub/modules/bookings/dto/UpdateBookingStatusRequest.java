package com.smartcampus.operationshub.modules.bookings.dto;

import jakarta.validation.constraints.Size;

public class UpdateBookingStatusRequest {

    @Size(max = 500)
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
