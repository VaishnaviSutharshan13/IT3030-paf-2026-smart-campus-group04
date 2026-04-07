-- Smart Campus Operations Hub - Initial relational schema (MySQL 8+)

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL
);

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NULL,
    oauth_provider VARCHAR(32) NULL,
    oauth_subject VARCHAR(191) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_users_oauth_identity (oauth_provider, oauth_subject)
);

CREATE TABLE user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE resource_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL
);

CREATE TABLE resources (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resource_type_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    location VARCHAR(120) NOT NULL,
    capacity INT UNSIGNED NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resources_type FOREIGN KEY (resource_type_id)
        REFERENCES resource_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_resources_created_by FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE booking_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL
);

CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    requester_user_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,
    status_id BIGINT UNSIGNED NOT NULL,
    current_approver_user_id BIGINT UNSIGNED NULL,
    approved_by_user_id BIGINT UNSIGNED NULL,
    cancelled_by_user_id BIGINT UNSIGNED NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    rejection_reason VARCHAR(500) NULL,
    approved_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ck_bookings_time_window CHECK (start_at < end_at),
    CONSTRAINT fk_bookings_requester FOREIGN KEY (requester_user_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_resource FOREIGN KEY (resource_id)
        REFERENCES resources(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_status FOREIGN KEY (status_id)
        REFERENCES booking_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_current_approver FOREIGN KEY (current_approver_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_approved_by FOREIGN KEY (approved_by_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_cancelled_by FOREIGN KEY (cancelled_by_user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE booking_status_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    status_id BIGINT UNSIGNED NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NOT NULL,
    change_note VARCHAR(500) NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_history_booking FOREIGN KEY (booking_id)
        REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_history_status FOREIGN KEY (status_id)
        REFERENCES booking_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_history_changed_by FOREIGN KEY (changed_by_user_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE ticket_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL
);

CREATE TABLE ticket_priorities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL,
    sort_order TINYINT UNSIGNED NOT NULL
);

CREATE TABLE tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_user_id BIGINT UNSIGNED NOT NULL,
    assigned_technician_user_id BIGINT UNSIGNED NULL,
    resource_id BIGINT UNSIGNED NULL,
    status_id BIGINT UNSIGNED NOT NULL,
    priority_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    incident_at DATETIME NULL,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_reporter FOREIGN KEY (reporter_user_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_assigned_technician FOREIGN KEY (assigned_technician_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_resource FOREIGN KEY (resource_id)
        REFERENCES resources(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_status FOREIGN KEY (status_id)
        REFERENCES ticket_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_priority FOREIGN KEY (priority_id)
        REFERENCES ticket_priorities(id) ON DELETE RESTRICT
);

CREATE TABLE comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    author_user_id BIGINT UNSIGNED NOT NULL,
    booking_id BIGINT UNSIGNED NULL,
    ticket_id BIGINT UNSIGNED NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ck_comments_single_parent CHECK (
        (booking_id IS NOT NULL AND ticket_id IS NULL) OR
        (booking_id IS NULL AND ticket_id IS NOT NULL)
    ),
    CONSTRAINT fk_comments_author FOREIGN KEY (author_user_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_comments_booking FOREIGN KEY (booking_id)
        REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE TABLE notification_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL
);

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id BIGINT UNSIGNED NOT NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    notification_type_id BIGINT UNSIGNED NOT NULL,
    booking_id BIGINT UNSIGNED NULL,
    ticket_id BIGINT UNSIGNED NULL,
    title VARCHAR(180) NOT NULL,
    message VARCHAR(500) NOT NULL,
    link_url VARCHAR(255) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_notifications_type FOREIGN KEY (notification_type_id)
        REFERENCES notification_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_notifications_booking FOREIGN KEY (booking_id)
        REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX idx_resources_type ON resources(resource_type_id);
CREATE INDEX idx_resources_location ON resources(location);

CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_requester ON bookings(requester_user_id);
CREATE INDEX idx_bookings_status ON bookings(status_id);
CREATE INDEX idx_bookings_current_approver ON bookings(current_approver_user_id);
CREATE INDEX idx_bookings_time ON bookings(start_at, end_at);

CREATE INDEX idx_booking_history_booking ON booking_status_history(booking_id);
CREATE INDEX idx_booking_history_status ON booking_status_history(status_id);

CREATE INDEX idx_tickets_reporter ON tickets(reporter_user_id);
CREATE INDEX idx_tickets_assigned_technician ON tickets(assigned_technician_user_id);
CREATE INDEX idx_tickets_resource ON tickets(resource_id);
CREATE INDEX idx_tickets_status ON tickets(status_id);
CREATE INDEX idx_tickets_priority ON tickets(priority_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

CREATE INDEX idx_comments_author ON comments(author_user_id);
CREATE INDEX idx_comments_booking ON comments(booking_id);
CREATE INDEX idx_comments_ticket ON comments(ticket_id);

CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_user_id, is_read, created_at);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);
CREATE INDEX idx_notifications_ticket ON notifications(ticket_id);

INSERT INTO roles (code, display_name) VALUES
('USER', 'Standard User'),
('ADMIN', 'Administrator'),
('TECHNICIAN', 'Technician');

INSERT INTO resource_types (code, display_name) VALUES
('ROOM', 'Room'),
('LAB', 'Laboratory'),
('EQUIPMENT', 'Equipment');

INSERT INTO booking_statuses (code, display_name) VALUES
('PENDING', 'Pending Approval'),
('APPROVED', 'Approved'),
('REJECTED', 'Rejected'),
('CANCELLED', 'Cancelled'),
('COMPLETED', 'Completed');

INSERT INTO ticket_statuses (code, display_name) VALUES
('OPEN', 'Open'),
('IN_PROGRESS', 'In Progress'),
('RESOLVED', 'Resolved'),
('CLOSED', 'Closed');

INSERT INTO ticket_priorities (code, display_name, sort_order) VALUES
('LOW', 'Low', 1),
('MEDIUM', 'Medium', 2),
('HIGH', 'High', 3),
('CRITICAL', 'Critical', 4);

INSERT INTO notification_types (code, display_name) VALUES
('BOOKING_REQUESTED', 'Booking Requested'),
('BOOKING_APPROVED', 'Booking Approved'),
('BOOKING_REJECTED', 'Booking Rejected'),
('TICKET_CREATED', 'Ticket Created'),
('TICKET_ASSIGNED', 'Ticket Assigned'),
('TICKET_RESOLVED', 'Ticket Resolved'),
('SYSTEM', 'System Notification');
