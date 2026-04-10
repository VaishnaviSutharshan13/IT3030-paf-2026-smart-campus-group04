ALTER TABLE bookings
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

UPDATE bookings b
SET status = bs.code
FROM booking_statuses bs
WHERE b.status_id = bs.id;

INSERT INTO users (email, full_name, password_hash, is_active)
SELECT 'admin@campus.edu', 'System Administrator', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI2C6jM4mQUp3NEPoPFcAckU4iigI5y', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@campus.edu'
);

INSERT INTO users (email, full_name, password_hash, is_active)
SELECT 'user@campus.edu', 'Campus User', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI2C6jM4mQUp3NEPoPFcAckU4iigI5y', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'user@campus.edu'
);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'ADMIN'
WHERE u.email = 'admin@campus.edu'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'USER'
WHERE u.email = 'user@campus.edu'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

INSERT INTO resources (resource_type_id, code, name, location, capacity, description, is_active, created_by)
SELECT rt.id, 'LAB-B1', 'IoT Lab B1', 'Engineering Building', 40, 'Primary IoT laboratory', TRUE, u.id
FROM resource_types rt
JOIN users u ON u.email = 'admin@campus.edu'
WHERE rt.code = 'LAB'
  AND NOT EXISTS (
      SELECT 1 FROM resources r WHERE r.code = 'LAB-B1'
  );

INSERT INTO notifications (recipient_user_id, actor_user_id, notification_type_id, title, message, is_read)
SELECT u.id, a.id, nt.id, 'Welcome to Smart Campus', 'Your account is ready. Start creating bookings and tickets.', FALSE
FROM users u
JOIN users a ON a.email = 'admin@campus.edu'
JOIN notification_types nt ON nt.code = 'SYSTEM'
WHERE u.email = 'user@campus.edu'
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.recipient_user_id = u.id AND n.title = 'Welcome to Smart Campus'
  );
