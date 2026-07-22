-- NovaCore Sprint 4.1: Life Spaces foundation
-- Table: spaces

CREATE TABLE spaces (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      UUID         NOT NULL,
    name          VARCHAR(100) NOT NULL,
    slug          VARCHAR(100) NOT NULL,
    description   TEXT,
    icon          VARCHAR(50),
    color         VARCHAR(20),
    type          VARCHAR(30)  NOT NULL DEFAULT 'BLANK',
    is_favorite   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_archived   BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_spaces_owner_id
        FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_spaces_owner_slug UNIQUE (owner_id, slug),
    CONSTRAINT chk_spaces_type CHECK (type IN (
        'HOME', 'FAMILY', 'WORK', 'PROJECT', 'TRAVEL', 'HEALTH',
        'FINANCE', 'VEHICLE', 'EDUCATION', 'COLLECTION', 'BLANK'
    ))
);

CREATE INDEX idx_spaces_owner_id ON spaces (owner_id);
CREATE INDEX idx_spaces_owner_archived ON spaces (owner_id, is_archived);
CREATE INDEX idx_spaces_owner_display_order ON spaces (owner_id, display_order);

COMMENT ON TABLE spaces IS 'Top-level Life Space containers owned by a user';
COMMENT ON COLUMN spaces.slug IS 'URL-safe identifier unique per owner';
COMMENT ON COLUMN spaces.type IS 'Life Space category (HOME, HEALTH, TRAVEL, etc.)';
COMMENT ON COLUMN spaces.is_archived IS 'Soft-delete flag; archived spaces are hidden from default listings';
