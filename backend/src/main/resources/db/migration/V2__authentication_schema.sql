-- NovaCore Sprint 2.1: Authentication database foundation
-- Tables: users, roles, permissions, user_roles, role_permissions, refresh_tokens

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL,
    username          VARCHAR(100) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    first_name        VARCHAR(100),
    last_name         VARCHAR(100),
    phone_number      VARCHAR(30),
    profile_image_url TEXT,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    email_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED'))
);

CREATE INDEX idx_users_email  ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_status ON users (status);

COMMENT ON TABLE users IS 'Application user accounts';
COMMENT ON COLUMN users.password_hash IS 'BCrypt-hashed password; never store plain text';
COMMENT ON COLUMN users.status IS 'Account state: ACTIVE, INACTIVE, or LOCKED';

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE INDEX idx_roles_name ON roles (name);

COMMENT ON TABLE roles IS 'RBAC roles (e.g. USER, ADMIN)';

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
CREATE TABLE permissions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_permissions_name UNIQUE (name)
);

CREATE INDEX idx_permissions_name ON permissions (name);

COMMENT ON TABLE permissions IS 'Granular RBAC permissions';

-- ---------------------------------------------------------------------------
-- user_roles (many-to-many: users <-> roles)
-- ---------------------------------------------------------------------------
CREATE TABLE user_roles (
    user_id    UUID        NOT NULL,
    role_id    UUID        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

COMMENT ON TABLE user_roles IS 'Maps users to their assigned roles';

-- ---------------------------------------------------------------------------
-- role_permissions (many-to-many: roles <-> permissions)
-- ---------------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id       UUID        NOT NULL,
    permission_id UUID        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role_id
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);

COMMENT ON TABLE role_permissions IS 'Maps roles to their granted permissions';

-- ---------------------------------------------------------------------------
-- refresh_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash),

    CONSTRAINT fk_refresh_tokens_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX idx_refresh_tokens_active     ON refresh_tokens (user_id, expires_at)
    WHERE revoked = FALSE;

COMMENT ON TABLE refresh_tokens IS 'Hashed refresh tokens for session renewal';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 or similar hash; never store plain tokens';
