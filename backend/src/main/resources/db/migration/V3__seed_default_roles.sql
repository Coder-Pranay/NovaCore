-- Seed default RBAC roles (no users).

INSERT INTO roles (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'USER', 'Default application user', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'USER');

INSERT INTO roles (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ADMIN', 'Administrator with elevated privileges', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');
