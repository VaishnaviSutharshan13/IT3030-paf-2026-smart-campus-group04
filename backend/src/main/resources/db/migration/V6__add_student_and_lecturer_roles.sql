INSERT INTO roles (code, display_name)
SELECT 'STUDENT', 'Student'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'STUDENT');

INSERT INTO roles (code, display_name)
SELECT 'LECTURER', 'Lecturer'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'LECTURER');
