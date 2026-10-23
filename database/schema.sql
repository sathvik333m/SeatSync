-- ====================================================================
-- SeatSync — Campus Resource Reservation & Peer Learning Platform
-- Full Relational Database Schema (PostgreSQL 15+)
-- ====================================================================

-- 1. Ensure required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Clean teardown for clean migrations/testing
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS learning_sessions CASCADE;
DROP TABLE IF EXISTS learning_requests CASCADE;
DROP TABLE IF EXISTS learning_listings CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS resource_maintenance CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ====================================================================
-- MODULE A: IDENTITY & CAMPUS RESOURCES
-- ====================================================================

CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resources (
    resource_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    resource_type VARCHAR(30) NOT NULL CHECK (
        resource_type IN ('study_room', 'lab', 'meeting_room', 'other')
    ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reservations (
    reservation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    resource_id BIGINT NOT NULL REFERENCES resources(resource_id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (
        status IN ('pending', 'confirmed', 'cancelled')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time),
    -- EXCLUSION CONSTRAINT: Enforces at the database engine level that no two active
    -- reservations for the same resource can overlap in time.
    -- Half-open range [) allows a booking ending at 11:00 to seamlessly meet a booking starting at 11:00.
    CONSTRAINT no_overlapping_reservations EXCLUDE USING gist (
        resource_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status IN ('pending', 'confirmed'))
);

CREATE TABLE resource_maintenance (
    maintenance_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES resources(resource_id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    CHECK (end_time > start_time)
);

-- Strategic Indexes for Module A
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_resource_start ON reservations(resource_id, start_time);
CREATE INDEX idx_maintenance_resource_start ON resource_maintenance(resource_id, start_time);
CREATE INDEX idx_resources_active_type ON resources(is_active, resource_type);

-- ====================================================================
-- MODULE B: PEER LEARNING MARKETPLACE
-- ====================================================================

CREATE TABLE skills (
    skill_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL
);

CREATE TABLE learning_listings (
    listing_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(user_id),
    skill_id BIGINT NOT NULL REFERENCES skills(skill_id),
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    teaching_format VARCHAR(20) NOT NULL CHECK (teaching_format IN ('individual', 'group')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    max_participants INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (
        status IN ('draft', 'published', 'paused', 'closed')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce capacity constraints based on format
    CHECK (
        (teaching_format = 'individual' AND max_participants = 1) OR
        (teaching_format = 'group' AND max_participants >= 2)
    )
);

CREATE INDEX idx_listings_skill_status ON learning_listings(skill_id, status);
CREATE INDEX idx_listings_teacher ON learning_listings(teacher_id);
CREATE INDEX idx_listings_status_created ON learning_listings(status, created_at DESC);

CREATE TABLE learning_requests (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES learning_listings(listing_id),
    learner_id BIGINT NOT NULL REFERENCES users(user_id),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'rejected', 'withdrawn')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, learner_id),
    UNIQUE (request_id, listing_id)
);

CREATE INDEX idx_requests_listing_status ON learning_requests(listing_id, status);
CREATE INDEX idx_requests_learner ON learning_requests(learner_id);

CREATE TABLE learning_sessions (
    session_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES learning_listings(listing_id),
    reservation_id BIGINT UNIQUE REFERENCES reservations(reservation_id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'completed', 'cancelled')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX idx_sessions_listing_start ON learning_sessions(listing_id, start_time);
CREATE INDEX idx_sessions_start ON learning_sessions(start_time) WHERE status = 'scheduled';

CREATE TABLE session_participants (
    session_id BIGINT NOT NULL REFERENCES learning_sessions(session_id),
    learner_id BIGINT NOT NULL REFERENCES users(user_id),
    request_id BIGINT NOT NULL UNIQUE,
    listing_id BIGINT NOT NULL,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (
        attendance_status IN ('registered', 'attended', 'absent', 'cancelled')
    ),
    PRIMARY KEY (session_id, learner_id),
    FOREIGN KEY (request_id, listing_id) REFERENCES learning_requests(request_id, listing_id)
);

CREATE INDEX idx_participants_session ON session_participants(session_id);
CREATE INDEX idx_participants_learner ON session_participants(learner_id);

-- ====================================================================
-- AUDIT LOGS (Polymorphic action tracking with JSONB details)
-- ====================================================================

CREATE TABLE audit_logs (
    log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id BIGINT REFERENCES users(user_id),
    entity_type VARCHAR(40) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(60) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
