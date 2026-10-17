-- Auth security tokens (password reset / email verification) + session metadata on refresh tokens.

CREATE TABLE security_tokens (
    id              UUID PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash      VARCHAR(64)  NOT NULL,
    token_type      VARCHAR(32)  NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_security_tokens_hash UNIQUE (token_hash),
    CONSTRAINT chk_security_tokens_type CHECK (token_type IN ('PASSWORD_RESET', 'EMAIL_VERIFICATION'))
);

CREATE INDEX idx_security_tokens_user_type ON security_tokens (user_id, token_type);
CREATE INDEX idx_security_tokens_expires ON security_tokens (expires_at);

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS user_agent VARCHAR(512),
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64),
    ADD COLUMN IF NOT EXISTS device_label VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

UPDATE refresh_tokens
SET last_used_at = COALESCE(updated_at, created_at, NOW())
WHERE last_used_at IS NULL;

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS chk_activity_logs_entity_type;
ALTER TABLE activity_logs ADD CONSTRAINT chk_activity_logs_entity_type CHECK (entity_type IN (
    'SPACE', 'ASSET', 'PROFILE', 'AUTH'
));

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS chk_activity_logs_action;
ALTER TABLE activity_logs ADD CONSTRAINT chk_activity_logs_action CHECK (action IN (
    'CREATED', 'UPDATED', 'ARCHIVED', 'UPLOADED', 'RESTORED', 'FAVORITED', 'UNFAVORITED',
    'PASSWORD_CHANGED', 'EMAIL_VERIFIED', 'PASSWORD_RESET'
));

COMMENT ON TABLE security_tokens IS 'One-time auth tokens stored as SHA-256 hashes only';
