ALTER TABLE incidents
    DROP CONSTRAINT IF EXISTS ck_incidents_status;

ALTER TABLE incidents
    ADD CONSTRAINT ck_incidents_status
    CHECK (status IN ('PENDING', 'ASSIGNED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED'));
