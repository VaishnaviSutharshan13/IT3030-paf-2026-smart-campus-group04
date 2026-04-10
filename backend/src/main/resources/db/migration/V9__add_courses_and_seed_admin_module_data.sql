CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(160) NOT NULL,
    description TEXT NULL,
    lecturer VARCHAR(120) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

INSERT INTO courses (code, title, description, lecturer)
SELECT 'CS101', 'Introduction to Smart Campus Systems', 'Foundational concepts of campus automation and operations.', 'Dr. Perera'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'CS101');

INSERT INTO courses (code, title, description, lecturer)
SELECT 'IT203', 'IoT Infrastructure Lab', 'Practical course for smart lab device management and troubleshooting.', 'Prof. Silva'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'IT203');

INSERT INTO users (email, full_name, password_hash, is_active)
SELECT 'lecturer@campus.edu', 'Default Lecturer', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI2C6jM4mQUp3NEPoPFcAckU4iigI5y', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'lecturer@campus.edu');

INSERT INTO users (email, full_name, password_hash, is_active)
SELECT 'technician@campus.edu', 'Default Technician', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI2C6jM4mQUp3NEPoPFcAckU4iigI5y', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'technician@campus.edu');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'LECTURER'
WHERE u.email = 'lecturer@campus.edu'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'TECHNICIAN'
WHERE u.email = 'technician@campus.edu'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

INSERT INTO resources (resource_type_id, code, name, location, capacity, description, is_active, created_by)
SELECT rt.id, 'ROOM-201', 'Lecture Hall 201', 'Academic Block A - Floor 2', 80, 'Main lecture hall for engineering faculty', TRUE, admin_user.id
FROM resource_types rt
JOIN users admin_user ON admin_user.email = 'admin@campus.edu'
WHERE rt.code = 'ROOM'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE code = 'ROOM-201');

INSERT INTO resources (resource_type_id, code, name, location, capacity, description, is_active, created_by)
SELECT rt.id, 'LAB-B2', 'Computer Lab B2', 'Engineering Building - Floor 2', 40, 'General purpose computing laboratory', TRUE, admin_user.id
FROM resource_types rt
JOIN users admin_user ON admin_user.email = 'admin@campus.edu'
WHERE rt.code = 'LAB'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE code = 'LAB-B2');

INSERT INTO incidents (
    reported_by,
    location_type,
    floor,
    issue_type,
    description,
    priority,
    status,
    assigned_to
)
SELECT lecturer_user.id,
       'SMART_CLASSROOM',
       'Floor 2',
       'PROJECTOR',
       'Projector is flickering during presentations.',
       'HIGH',
       'ASSIGNED',
       tech_user.id
FROM users lecturer_user
JOIN users tech_user ON tech_user.email = 'technician@campus.edu'
WHERE lecturer_user.email = 'lecturer@campus.edu'
  AND NOT EXISTS (SELECT 1 FROM incidents WHERE description = 'Projector is flickering during presentations.');

INSERT INTO notifications (
    recipient_user_id,
    actor_user_id,
    notification_type_id,
    title,
    message,
    is_read
)
SELECT admin_user.id,
       lecturer_user.id,
       nt.id,
       'New Incident Reported',
       'A lecturer reported a projector issue in Smart Classroom Floor 2.',
       FALSE
FROM users admin_user
JOIN users lecturer_user ON lecturer_user.email = 'lecturer@campus.edu'
JOIN notification_types nt ON nt.code = 'SYSTEM'
WHERE admin_user.email = 'admin@campus.edu'
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.recipient_user_id = admin_user.id
        AND n.title = 'New Incident Reported'
        AND n.message = 'A lecturer reported a projector issue in Smart Classroom Floor 2.'
  );
