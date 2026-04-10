package com.smartcampus.operationshub.modules.courses.repository;

import com.smartcampus.operationshub.modules.courses.entity.Course;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCodeIgnoreCase(String code);
}
