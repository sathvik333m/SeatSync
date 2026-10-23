-- ====================================================================
-- SeatSync — Realistic Seed Data for DBMS College Project Demonstration
-- ====================================================================

-- 1. SEED USERS
-- Password for all student accounts is: password123
-- Password for admin account is: admin123
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
('Alex Chen', 'alex.chen@campus.edu', '$2a$10$l7urr5uAXUQpchnTzWUmXO7yiBFGHfL9wjXqACr6RsBA/M0VIKXa.', 'student', TRUE),
('Priya Sharma', 'priya.sharma@campus.edu', '$2a$10$l7urr5uAXUQpchnTzWUmXO7yiBFGHfL9wjXqACr6RsBA/M0VIKXa.', 'student', TRUE),
('Marcus Johnson', 'marcus.johnson@campus.edu', '$2a$10$l7urr5uAXUQpchnTzWUmXO7yiBFGHfL9wjXqACr6RsBA/M0VIKXa.', 'student', TRUE),
('Elena Rostova', 'elena.rostova@campus.edu', '$2a$10$l7urr5uAXUQpchnTzWUmXO7yiBFGHfL9wjXqACr6RsBA/M0VIKXa.', 'student', TRUE),
('Devon Vance', 'devon.vance@campus.edu', '$2a$10$l7urr5uAXUQpchnTzWUmXO7yiBFGHfL9wjXqACr6RsBA/M0VIKXa.', 'student', TRUE),
('Campus Admin', 'admin@campus.edu', '$2a$10$TUPORZm5xv7fn1fqDFSyB.IdH3mBE8iz4nVf9ZjP5MmuEKDqSXZrG', 'admin', TRUE);

-- 2. SEED CAMPUS RESOURCES
INSERT INTO resources (name, location, capacity, resource_type, is_active) VALUES
('Turing Lab Room 101', 'CS Wing, 1st Floor', 8, 'study_room', TRUE),
('Ada Lovelace Seminar Hall', 'Main Engineering Block, 2nd Floor', 25, 'meeting_room', TRUE),
('Systems & Robotics Lab B', 'Hardware Annex, Ground Floor', 16, 'lab', TRUE),
('Quiet Focus Pod 3', 'Central Library, 3rd Floor', 2, 'study_room', TRUE),
('Media Studio 402', 'Student Union, 4th Floor', 10, 'other', TRUE);

-- 3. SEED SKILLS
INSERT INTO skills (name, category) VALUES
('React.js & Modern Web Architecture', 'Web Development'),
('PostgreSQL Query Optimization & Indexing', 'Database Systems'),
('Python Data Science & Pandas', 'Data Science'),
('Rust Systems & Memory Safety', 'Systems Programming'),
('Docker & Microservices Deployment', 'Cloud & DevOps'),
('Algorithm Design & Competitive Coding', 'Computer Science');

-- 4. SEED RESOURCE MAINTENANCE (Lab B maintenance tomorrow morning)
INSERT INTO resource_maintenance (resource_id, start_time, end_time, reason) VALUES
(3, NOW() + INTERVAL '1 day' + INTERVAL '2 hours', NOW() + INTERVAL '1 day' + INTERVAL '6 hours', 'Scheduled firmware upgrade and network switch rewiring');

-- 5. SEED LEARNING LISTINGS
-- Listing 1: Group workshop by Alex (max 4)
INSERT INTO learning_listings (teacher_id, skill_id, title, description, teaching_format, difficulty, max_participants, status) VALUES
(1, 1, 'React 19 & Fullstack State Mastery', 'Hands-on crash course on React 19 Actions, Server Components, and Optimistic UI updates. We will build a live mini-project together.', 'group', 'intermediate', 4, 'published'),

-- Listing 2: Group workshop by Priya (max 3)
(2, 2, 'Deep Dive into B-Tree Indexes & EXPLAIN ANALYZE', 'Learn how PostgreSQL stores rows in pages, how B-Tree traversal works, and how to eliminate sequential scans in heavy queries.', 'group', 'advanced', 3, 'published'),

-- Listing 3: Individual 1-on-1 by Marcus (max 1)
(3, 3, '1-on-1 Python Fundamentals for Beginners', 'Personalized tutoring session covering Python data structures, list comprehensions, and scripting automation.', 'individual', 'beginner', 1, 'published'),

-- Listing 4: Group workshop by Alex (max 5)
(1, 5, 'Dockerizing Node.js & Multi-Container Postgres', 'Learn Dockerfile best practices, docker-compose orchestration, volume persistence, and networking for database apps.', 'group', 'intermediate', 5, 'published');

-- 6. SEED LEARNING REQUESTS
-- Elena requests Alex''s React listing
INSERT INTO learning_requests (listing_id, learner_id, message, status) VALUES
(1, 4, 'Hi Alex, I am working on my college project and really want to master React state handling!', 'accepted'),

-- Devon requests Alex''s React listing
(1, 5, 'Excited to attend the React session! I have basic JS experience.', 'accepted'),

-- Elena requests Priya''s Database listing (pending)
(2, 4, 'Would love to understand how Postgres indexing works under the hood.', 'pending'),

-- Devon requests Marcus''s Python 1-on-1 (pending)
(3, 5, 'Looking forward to strengthening my core Python skills.', 'pending'),

-- Priya requests Alex''s Docker listing (pending)
(4, 2, 'Looking to learn how to containerize my Postgres experiments.', 'pending');

-- 7. SEED INITIAL RESERVATIONS
-- Reservation for an upcoming study session in Turing Lab Room 101 tomorrow afternoon
INSERT INTO reservations (user_id, resource_id, start_time, end_time, status) VALUES
(1, 1, NOW() + INTERVAL '1 day' + INTERVAL '7 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', 'confirmed'),
-- Completed past reservation in Ada Lovelace Hall
(2, 2, NOW() - INTERVAL '3 days' + INTERVAL '4 hours', NOW() - INTERVAL '3 days' + INTERVAL '6 hours', 'confirmed');

-- 8. SEED LEARNING SESSIONS
-- Link Alex''s React session to Reservation 1
INSERT INTO learning_sessions (listing_id, reservation_id, start_time, end_time, status) VALUES
(1, 1, NOW() + INTERVAL '1 day' + INTERVAL '7 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', 'scheduled'),
-- Completed past session for Priya''s listing
(2, NULL, NOW() - INTERVAL '2 days' + INTERVAL '3 hours', NOW() - INTERVAL '2 days' + INTERVAL '5 hours', 'completed');

-- 9. SEED SESSION PARTICIPANTS
-- Elena and Devon in Alex''s scheduled React session
INSERT INTO session_participants (session_id, learner_id, request_id, listing_id, attendance_status) VALUES
(1, 4, 1, 1, 'registered'),
(1, 5, 2, 1, 'registered');

-- 10. SEED AUDIT LOGS
INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, details) VALUES
(1, 'listing', 1, 'CREATED', '{"title": "React 19 & Fullstack State Mastery", "format": "group"}'::jsonb),
(2, 'listing', 2, 'CREATED', '{"title": "Deep Dive into B-Tree Indexes", "format": "group"}'::jsonb),
(1, 'reservation', 1, 'RESERVED', '{"resource_name": "Turing Lab Room 101", "purpose": "Peer workshop"}'::jsonb),
(1, 'session', 1, 'SCHEDULED_WITH_ROOM', '{"session_id": 1, "room_id": 1, "participants_count": 2}'::jsonb),
(4, 'request', 1, 'SUBMITTED', '{"listing_id": 1, "learner": "Elena Rostova"}'::jsonb),
(1, 'request', 1, 'ACCEPTED', '{"by_teacher": 1}'::jsonb);
