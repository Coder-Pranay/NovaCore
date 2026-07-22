-- NovaCore Sprint 5.3: Indexes to support user-scoped global search
-- Filters by owner_id + is_archived, then matches/sorts on name

CREATE INDEX idx_spaces_owner_active_name ON spaces (owner_id, is_archived, name);
CREATE INDEX idx_assets_owner_active_name ON assets (owner_id, is_archived, name);

COMMENT ON INDEX idx_spaces_owner_active_name IS 'Supports global search: active spaces by owner ordered by name';
COMMENT ON INDEX idx_assets_owner_active_name IS 'Supports global search: active assets by owner ordered by name';
