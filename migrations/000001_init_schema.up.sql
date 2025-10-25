-- 001_init_schema.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS desks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    reserved BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    desk_id INT NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    time_slot TEXT NOT NULL DEFAULT 'full_day',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (desk_id, reservation_date, time_slot)
);
