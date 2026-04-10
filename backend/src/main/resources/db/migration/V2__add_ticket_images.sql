CREATE TABLE ticket_images (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    uploaded_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_images_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_images_uploaded_by FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_ticket_images_ticket ON ticket_images(ticket_id);
