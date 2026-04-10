CREATE TABLE incidents (
    id BIGSERIAL PRIMARY KEY,
    reported_by BIGINT NOT NULL,
    location_type VARCHAR(50) NOT NULL,
    floor VARCHAR(40) NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    assigned_to BIGINT NULL,
    technician_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidents_reported_by FOREIGN KEY (reported_by)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_incidents_assigned_to FOREIGN KEY (assigned_to)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT ck_incidents_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT ck_incidents_status CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED')),
    CONSTRAINT ck_incidents_location_type CHECK (location_type IN ('LECTURE_HALL', 'SMART_CLASSROOM', 'CLASSROOM', 'LAB')),
    CONSTRAINT ck_incidents_issue_type CHECK (issue_type IN ('COMPUTER', 'AC', 'LIGHTS', 'PROJECTOR', 'NETWORK', 'OTHER'))
);

CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_location_type ON incidents(location_type);
