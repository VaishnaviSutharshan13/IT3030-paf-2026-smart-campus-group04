package com.smartcampus.operationshub.modules.bookings.workflow;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.modules.bookings.entity.BookingStatus;

public final class BookingWorkflowValidator {

    private BookingWorkflowValidator() {
    }

    public static void assertTransition(BookingStatus current, BookingStatus target) {
        if (!current.canTransitionTo(target)) {
            throw new BusinessRuleException(
                    "Invalid booking transition: " + current + " -> " + target
            );
        }
    }
}
