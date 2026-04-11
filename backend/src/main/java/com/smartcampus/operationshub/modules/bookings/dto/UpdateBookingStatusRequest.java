package com.smartcampus.operationshub.modules.bookings.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

public class UpdateBookingStatusRequest {

    @JsonAlias({"booking_status"})
    @Size(max = 50)
    private String status;

    @Size(max = 500)
    private String reason;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
