CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE RESTRICT
);

INSERT INTO roles (code, display_name)
SELECT 'USER', 'Standard User'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'USER');

INSERT INTO roles (code, display_name)
SELECT 'ADMIN', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'ADMIN');
