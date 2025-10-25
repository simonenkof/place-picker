-- 001_init_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS desks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    desk_id UUID NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
    date_from TIMESTAMP WITH TIME ZONE NOT NULL,
    date_to TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reservations
ADD CONSTRAINT one_reservation_per_desk_per_period
EXCLUDE USING gist (
    desk_id WITH =,
    tstzrange(date_from, date_to, '[)') WITH &&
);

ALTER TABLE reservations
ADD CONSTRAINT one_desk_per_user_per_period
EXCLUDE USING gist (
    user_id WITH =,
    tstzrange(date_from, date_to, '[)') WITH &&
);

CREATE OR REPLACE VIEW desks_with_reserved AS
SELECT
    d.id,
    d.name,
    EXISTS (
        SELECT 1
        FROM reservations r
        WHERE r.desk_id = d.id
          AND CURRENT_TIMESTAMP BETWEEN r.date_from AND r.date_to
    ) AS reserved
FROM desks d;