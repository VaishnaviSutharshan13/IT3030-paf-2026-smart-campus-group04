package com.smartcampus.operationshub.modules.bookings.entity;

public enum BookingStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED;

    public boolean canTransitionTo(BookingStatus target) {
        if (this == PENDING) {
            return target == APPROVED || target == REJECTED || target == CANCELLED;
        }
        if (this == APPROVED) {
            return target == CANCELLED;
        }
        return false;
    }
}
