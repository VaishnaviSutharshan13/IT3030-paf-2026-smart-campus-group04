package com.smartcampus.operationshub.modules.bookings.dto.validation;

import com.smartcampus.operationshub.modules.bookings.dto.CreateBookingRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TimeRangeValidator implements ConstraintValidator<ValidTimeRange, CreateBookingRequest> {

    @Override
    public boolean isValid(CreateBookingRequest value, ConstraintValidatorContext context) {
        if (value == null || value.getStartAt() == null || value.getEndAt() == null) {
            return true;
        }
        return value.getStartAt().isBefore(value.getEndAt());
    }
}
