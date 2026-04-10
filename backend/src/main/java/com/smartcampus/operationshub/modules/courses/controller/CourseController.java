package com.smartcampus.operationshub.modules.courses.controller;

import com.smartcampus.operationshub.modules.courses.dto.CourseResponse;
import com.smartcampus.operationshub.modules.courses.dto.CreateCourseRequest;
import com.smartcampus.operationshub.modules.courses.dto.UpdateCourseRequest;
import com.smartcampus.operationshub.modules.courses.service.CourseService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/courses", "/api/courses"})
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<CourseResponse> listCourses() {
        return courseService.listCourses();
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request));
    }

    @PutMapping("/{courseId}")
    public CourseResponse updateCourse(@PathVariable Long courseId, @Valid @RequestBody UpdateCourseRequest request) {
        return courseService.updateCourse(courseId, request);
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.noContent().build();
    }
}
