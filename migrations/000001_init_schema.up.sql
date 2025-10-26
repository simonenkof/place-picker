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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    desk_id UUID NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
    date_from TIMESTAMP WITH TIME ZONE NOT NULL,
    date_to TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT reservation_within_working_hours CHECK (
        EXTRACT(HOUR FROM date_from AT TIME ZONE 'UTC') >= 7
        AND EXTRACT(HOUR FROM date_to AT TIME ZONE 'UTC') <= 21
    )
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

CREATE OR REPLACE VIEW desks_with_slots AS
SELECT
    d.id,
    d.name,
    ARRAY_AGG(
        jsonb_build_object(
            'date_from', r.date_from,
            'date_to', r.date_to
        )
        ORDER BY r.date_from
    ) AS reserved_slots
FROM desks d
LEFT JOIN reservations r ON r.desk_id = d.id
GROUP BY d.id, d.name;