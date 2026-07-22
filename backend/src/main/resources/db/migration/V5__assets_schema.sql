-- NovaCore Sprint 4.2: Assets foundation (metadata only; no file storage yet)
-- Table: assets

CREATE TABLE assets (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id          UUID         NOT NULL,
    space_id          UUID         NOT NULL,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    asset_type        VARCHAR(30)  NOT NULL,
    mime_type         VARCHAR(127),
    file_size         BIGINT,
    storage_key       TEXT,
    original_filename VARCHAR(255),
    extension         VARCHAR(20),
    is_favorite       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_archived       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_assets_owner_id
        FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_assets_space_id
        FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE,
    CONSTRAINT chk_assets_type CHECK (asset_type IN (
        'DOCUMENT', 'IMAGE', 'VIDEO', 'PDF', 'NOTE', 'LINK', 'FILE'
    )),
    CONSTRAINT chk_assets_file_size CHECK (file_size IS NULL OR file_size >= 0)
);

CREATE INDEX idx_assets_owner_id ON assets (owner_id);
CREATE INDEX idx_assets_space_id ON assets (space_id);
CREATE INDEX idx_assets_owner_archived ON assets (owner_id, is_archived);
CREATE INDEX idx_assets_space_archived ON assets (space_id, is_archived);

COMMENT ON TABLE assets IS 'Digital asset metadata stored within Life Spaces';
COMMENT ON COLUMN assets.storage_key IS 'Object storage key; populated when file upload is implemented';
COMMENT ON COLUMN assets.is_archived IS 'Soft-delete flag; archived assets are hidden from default listings';
