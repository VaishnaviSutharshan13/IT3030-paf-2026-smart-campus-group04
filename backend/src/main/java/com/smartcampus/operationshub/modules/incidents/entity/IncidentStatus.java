package com.smartcampus.operationshub.modules.incidents.entity;

public enum IncidentStatus {
    PENDING,
    ASSIGNED,
    IN_PROGRESS,
    RESOLVED;

    public boolean canTransitionTo(IncidentStatus target) {
        if (this == PENDING) {
            return target == ASSIGNED;
        }
        if (this == ASSIGNED) {
            return target == IN_PROGRESS;
        }
        if (this == IN_PROGRESS) {
            return target == RESOLVED;
        }
        return false;
    }
}
