-- NovaCore Sprint 5.2: Activity log for user actions and recent activity feed
-- Table: activity_logs

CREATE TABLE activity_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    entity_type  VARCHAR(30)  NOT NULL,
    entity_id    UUID         NOT NULL,
    action       VARCHAR(30)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    metadata     JSONB,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_activity_logs_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_activity_logs_entity_type CHECK (entity_type IN (
        'SPACE', 'ASSET', 'PROFILE'
    )),
    CONSTRAINT chk_activity_logs_action CHECK (action IN (
        'CREATED', 'UPDATED', 'ARCHIVED', 'UPLOADED', 'RESTORED', 'FAVORITED', 'UNFAVORITED'
    ))
);

CREATE INDEX idx_activity_logs_user_created ON activity_logs (user_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON activity_logs (action);

COMMENT ON TABLE activity_logs IS 'Audit trail and recent activity feed for user actions';
COMMENT ON COLUMN activity_logs.metadata IS 'Optional JSON context; not exposed in default API responses';
