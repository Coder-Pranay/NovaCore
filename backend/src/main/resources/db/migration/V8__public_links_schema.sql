-- Public share links with optional bcrypt password hashes (never PasswordService).
CREATE TABLE public_links (
    id              UUID PRIMARY KEY,
    owner_id        UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    resource_type   VARCHAR(20)  NOT NULL,
    resource_id     UUID         NOT NULL,
    resource_name   VARCHAR(255) NOT NULL,
    token           VARCHAR(64)  NOT NULL,
    password_hash   VARCHAR(255),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_public_links_token UNIQUE (token),
    CONSTRAINT chk_public_links_resource_type CHECK (resource_type IN ('SPACE', 'ASSET'))
);

CREATE INDEX idx_public_links_owner ON public_links (owner_id);
CREATE INDEX idx_public_links_resource ON public_links (resource_type, resource_id);
CREATE UNIQUE INDEX uq_public_links_active_resource
    ON public_links (resource_type, resource_id)
    WHERE enabled = TRUE;

COMMENT ON COLUMN public_links.password_hash IS 'BCrypt hash only; never store plaintext share passwords';
