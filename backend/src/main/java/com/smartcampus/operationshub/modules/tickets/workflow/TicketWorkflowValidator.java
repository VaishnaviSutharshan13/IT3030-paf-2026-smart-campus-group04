package com.smartcampus.operationshub.modules.tickets.workflow;

import com.smartcampus.operationshub.common.exception.BusinessRuleException;
import com.smartcampus.operationshub.modules.tickets.entity.TicketStatusCode;

public final class TicketWorkflowValidator {

    private TicketWorkflowValidator() {
    }

    public static void assertTransition(TicketStatusCode current, TicketStatusCode target) {
        if (!current.canTransitionTo(target)) {
            throw new BusinessRuleException("Invalid ticket transition: " + current + " -> " + target);
        }
    }
}
