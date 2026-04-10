-- Safely decommission SUPER_ADMIN role by mapping all existing assignments to ADMIN.

INSERT INTO roles (code, display_name)
SELECT 'ADMIN', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'ADMIN');

WITH admin_role AS (
    SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1
),
super_roles AS (
    SELECT id FROM roles WHERE code IN ('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')
)
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT ur.user_id, ar.id, CURRENT_TIMESTAMP
FROM user_roles ur
CROSS JOIN admin_role ar
WHERE ur.role_id IN (SELECT id FROM super_roles)
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles existing
      WHERE existing.user_id = ur.user_id
        AND existing.role_id = ar.id
  );

DELETE FROM user_roles
WHERE role_id IN (SELECT id FROM roles WHERE code IN ('SUPER_ADMIN', 'ROLE_SUPER_ADMIN'));

DELETE FROM roles
WHERE code IN ('SUPER_ADMIN', 'ROLE_SUPER_ADMIN');
