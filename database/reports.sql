-- ====================================================================
-- SeatSync — DBMS College Project Evaluation SQL Reports & Analysis
-- ====================================================================

-- --------------------------------------------------------------------
-- REPORT A: Find the most popular skills (Aggregations, Joins & Subqueries)
-- --------------------------------------------------------------------
SELECT 
    s.name AS skill, 
    s.category,
    COUNT(DISTINCT l.listing_id) AS listings, 
    COUNT(DISTINCT q.request_id) AS requests 
FROM skills s 
JOIN learning_listings l ON l.skill_id = s.skill_id 
LEFT JOIN learning_requests q ON q.listing_id = l.listing_id 
WHERE l.status = 'published' 
GROUP BY s.skill_id, s.name, s.category 
ORDER BY requests DESC, listings DESC;


-- --------------------------------------------------------------------
-- REPORT B: Display upcoming learning sessions with their teachers and rooms
-- (Multi-table joins with optional linked physical reservations)
-- --------------------------------------------------------------------
SELECT 
    ls.session_id, 
    l.title, 
    u.name AS teacher, 
    ls.start_time, 
    ls.end_time, 
    COALESCE(r.name, 'Online / No room reserved') AS room,
    r.location,
    COUNT(sp.learner_id) AS enrolled_learners,
    l.max_participants AS capacity
FROM learning_sessions ls 
JOIN learning_listings l ON l.listing_id = ls.listing_id 
JOIN users u ON u.user_id = l.teacher_id 
LEFT JOIN reservations b ON b.reservation_id = ls.reservation_id 
LEFT JOIN resources r ON r.resource_id = b.resource_id 
LEFT JOIN session_participants sp ON sp.session_id = ls.session_id AND sp.attendance_status = 'registered'
WHERE ls.status = 'scheduled' AND ls.start_time >= NOW() - INTERVAL '1 day'
GROUP BY ls.session_id, l.title, u.name, ls.start_time, ls.end_time, r.name, r.location, l.max_participants
ORDER BY ls.start_time ASC;


-- --------------------------------------------------------------------
-- REPORT C: Students who have taught or attended the most sessions
-- (Leaderboards with GROUP BY, HAVING, and Aggregation)
-- --------------------------------------------------------------------
-- Top Teachers:
SELECT 
    u.user_id, 
    u.name, 
    COUNT(ls.session_id) AS completed_teaching_sessions 
FROM users u 
JOIN learning_listings l ON l.teacher_id = u.user_id 
JOIN learning_sessions ls ON ls.listing_id = l.listing_id 
WHERE ls.status = 'completed' 
GROUP BY u.user_id, u.name 
ORDER BY completed_teaching_sessions DESC;

-- Top Learners:
SELECT 
    u.user_id, 
    u.name, 
    COUNT(sp.session_id) AS attended_learning_sessions 
FROM users u 
JOIN session_participants sp ON sp.learner_id = u.user_id 
JOIN learning_sessions ls ON ls.session_id = sp.session_id 
WHERE ls.status = 'completed' AND sp.attendance_status = 'attended'
GROUP BY u.user_id, u.name 
ORDER BY attended_learning_sessions DESC;


-- --------------------------------------------------------------------
-- REPORT D: Resources with the highest booking demand
-- (Temporal duration calculations & SUM with COALESCE)
-- --------------------------------------------------------------------
SELECT 
    r.resource_id, 
    r.name, 
    r.resource_type,
    r.capacity,
    COUNT(b.reservation_id) AS confirmed_bookings, 
    COALESCE( 
        ROUND(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600)::numeric, 2), 
        0 
    ) AS total_booked_hours 
FROM resources r 
LEFT JOIN reservations b ON b.resource_id = r.resource_id AND b.status = 'confirmed' 
GROUP BY r.resource_id, r.name, r.resource_type, r.capacity 
ORDER BY total_booked_hours DESC, confirmed_bookings DESC;


-- --------------------------------------------------------------------
-- REPORT E: Pending learning requests for a teacher (Parameter query)
-- --------------------------------------------------------------------
-- Example for teacher_id = 1 (Alex Chen)
SELECT 
    q.request_id, 
    l.title, 
    u.name AS learner, 
    u.email AS learner_email,
    q.message, 
    q.created_at 
FROM learning_requests q 
JOIN learning_listings l ON l.listing_id = q.listing_id 
JOIN users u ON u.user_id = q.learner_id 
WHERE l.teacher_id = 1 AND q.status = 'pending' 
ORDER BY q.created_at ASC;


-- --------------------------------------------------------------------
-- REPORT F: Resource Maintenance Impact Audit
-- (Checks all reservations overlapping scheduled maintenance windows)
-- --------------------------------------------------------------------
SELECT 
    m.maintenance_id,
    r.name AS resource_name,
    m.start_time AS maintenance_start,
    m.end_time AS maintenance_end,
    m.reason,
    COUNT(res.reservation_id) AS conflicting_reservations_detected
FROM resource_maintenance m
JOIN resources r ON r.resource_id = m.resource_id
LEFT JOIN reservations res ON res.resource_id = m.resource_id 
    AND res.status IN ('pending', 'confirmed')
    AND res.start_time < m.end_time 
    AND res.end_time > m.start_time
GROUP BY m.maintenance_id, r.name, m.start_time, m.end_time, m.reason
ORDER BY m.start_time ASC;


-- --------------------------------------------------------------------
-- REPORT G: Audit Trail Summary by Entity & Action
-- --------------------------------------------------------------------
SELECT 
    a.entity_type,
    a.action,
    COUNT(*) AS event_count,
    MAX(a.created_at) AS last_occurred_at
FROM audit_logs a
GROUP BY a.entity_type, a.action
ORDER BY event_count DESC;


-- --------------------------------------------------------------------
-- DEMONSTRATION QUERY: EXPLAIN ANALYZE comparison for College Evaluation
-- Shows the optimizer choosing Index Scan on idx_sessions_start
-- --------------------------------------------------------------------
EXPLAIN ANALYZE 
SELECT * FROM learning_sessions 
WHERE status = 'scheduled' AND start_time >= NOW();
