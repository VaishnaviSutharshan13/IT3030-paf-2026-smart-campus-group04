package com.smartcampus.operationshub.modules.courses.service;

import com.smartcampus.operationshub.common.exception.ConflictException;
import com.smartcampus.operationshub.common.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.modules.courses.dto.CourseResponse;
import com.smartcampus.operationshub.modules.courses.dto.CreateCourseRequest;
import com.smartcampus.operationshub.modules.courses.dto.UpdateCourseRequest;
import com.smartcampus.operationshub.modules.courses.entity.Course;
import com.smartcampus.operationshub.modules.courses.repository.CourseRepository;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public List<CourseResponse> listCourses() {
        return courseRepository.findAll().stream().map(this::toResponse).toList();
    }

    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public CourseResponse createCourse(CreateCourseRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (courseRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new ConflictException("Course code already exists");
        }

        Course course = new Course();
        course.setCode(code);
        course.setTitle(request.getTitle().trim());
        course.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        course.setLecturer(request.getLecturer() == null ? null : request.getLecturer().trim());
        return toResponse(courseRepository.save(course));
    }

    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public CourseResponse updateCourse(Long courseId, UpdateCourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (request.getCode() != null && !request.getCode().isBlank()) {
            String nextCode = request.getCode().trim().toUpperCase();
            courseRepository.findByCodeIgnoreCase(nextCode)
                    .filter(existing -> !existing.getId().equals(courseId))
                    .ifPresent(existing -> {
                        throw new ConflictException("Course code already exists");
                    });
            course.setCode(nextCode);
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            course.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription().trim());
        }
        if (request.getLecturer() != null) {
            course.setLecturer(request.getLecturer().trim());
        }

        return toResponse(courseRepository.save(course));
    }

    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public void deleteCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found: " + courseId);
        }
        courseRepository.deleteById(courseId);
    }

    private CourseResponse toResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                course.getDescription(),
                course.getLecturer()
        );
    }
}
