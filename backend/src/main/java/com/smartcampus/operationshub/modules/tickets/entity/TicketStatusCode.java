package com.smartcampus.operationshub.modules.tickets.entity;

public enum TicketStatusCode {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    public boolean canTransitionTo(TicketStatusCode target) {
        if (this == OPEN) {
            return target == IN_PROGRESS;
        }
        if (this == IN_PROGRESS) {
            return target == RESOLVED;
        }
        if (this == RESOLVED) {
            return target == CLOSED;
        }
        return false;
    }
}
