package com.smartcampus.operationshub.modules.incidents.entity;

public enum IncidentStatus {
    PENDING,
    ASSIGNED,
    REJECTED,
    IN_PROGRESS,
    RESOLVED;

    public boolean canTransitionTo(IncidentStatus target) {
        if (this == target) {
            return true;
        }
        if (this == PENDING) {
            return target == ASSIGNED || target == REJECTED;
        }
        if (this == ASSIGNED) {
            return target == IN_PROGRESS || target == REJECTED;
        }
        if (this == IN_PROGRESS) {
            return target == RESOLVED;
        }
        return false;
    }
}
