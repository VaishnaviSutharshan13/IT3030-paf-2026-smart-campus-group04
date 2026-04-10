-- Normalize seeded local accounts to documented password: "password"
-- BCrypt hash generated via htpasswd (bcrypt):
-- $2y$05$sj5KDQRviESVGStIz/MOzuiyv3YY8Zvcv9jXt01s50TABbwipSfWW

UPDATE users
SET password_hash = '$2y$05$sj5KDQRviESVGStIz/MOzuiyv3YY8Zvcv9jXt01s50TABbwipSfWW'
WHERE email IN ('admin@campus.edu', 'user@campus.edu');
