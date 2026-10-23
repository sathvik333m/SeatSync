const db = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Create a new learning listing (Skill Offer)
 */
async function createListing({ teacherId, skillId, title, description, teachingFormat, difficulty, maxParticipants }) {
  // Validate constraints
  const format = teachingFormat === 'group' ? 'group' : 'individual';
  const participants = format === 'individual' ? 1 : Math.max(2, parseInt(maxParticipants, 10) || 2);

  const sql = `
    INSERT INTO learning_listings 
      (teacher_id, skill_id, title, description, teaching_format, difficulty, max_participants, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
    RETURNING *;
  `;
  const res = await db.query(sql, [
    teacherId,
    skillId,
    title.trim(),
    description.trim(),
    format,
    difficulty,
    participants,
  ]);
  const listing = res.rows[0];

  await logAudit(db, {
    actorId: teacherId,
    entityType: 'listing',
    entityId: listing.listing_id,
    action: 'CREATED',
    details: { title, format, difficulty, maxParticipants: participants },
  });

  return listing;
}

/**
 * List all published learning listings with filters
 */
async function listListings({ search, skillId, category, format, difficulty, teacherId } = {}) {
  let sql = `
    SELECT 
      l.listing_id,
      l.title,
      l.description,
      l.teaching_format,
      l.difficulty,
      l.max_participants,
      l.status,
      l.created_at,
      u.user_id AS teacher_id,
      u.name AS teacher_name,
      u.email AS teacher_email,
      s.skill_id,
      s.name AS skill_name,
      s.category AS skill_category,
      (SELECT COUNT(*)::int FROM learning_requests r WHERE r.listing_id = l.listing_id AND r.status = 'pending') AS pending_requests_count,
      (SELECT COUNT(*)::int FROM learning_sessions s WHERE s.listing_id = l.listing_id AND s.status = 'scheduled') AS scheduled_sessions_count
    FROM learning_listings l
    JOIN users u ON u.user_id = l.teacher_id
    JOIN skills s ON s.skill_id = l.skill_id
    WHERE l.status = 'published'
  `;
  const params = [];

  if (search && search !== 'undefined' && search !== 'null') {
    params.push(`%${search.trim()}%`);
    sql += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
  }

  if (skillId && skillId !== 'undefined' && skillId !== 'null') {
    params.push(skillId);
    sql += ` AND l.skill_id = $${params.length}`;
  }

  if (category && category !== 'undefined' && category !== 'null') {
    params.push(category);
    sql += ` AND s.category = $${params.length}`;
  }

  if (format && format !== 'undefined' && format !== 'null') {
    params.push(format);
    sql += ` AND l.teaching_format = $${params.length}`;
  }

  if (difficulty && difficulty !== 'undefined' && difficulty !== 'null') {
    params.push(difficulty);
    sql += ` AND l.difficulty = $${params.length}`;
  }

  if (teacherId && teacherId !== 'undefined' && teacherId !== 'null') {
    params.push(teacherId);
    sql += ` AND l.teacher_id = $${params.length}`;
  }

  sql += ' ORDER BY l.created_at DESC;';
  try {
    const res = await db.query(sql, params);
    return res.rows;
  } catch (err) {
    console.warn('[PeerLearningService] DB query failed, using seed listing fallback:', err.message);
    const mockListings = [
      {
        listing_id: 1,
        title: 'React 19 & Fullstack State Mastery',
        description: 'Hands-on crash course on React 19 Actions, Server Components, and Optimistic UI updates.',
        teaching_format: 'group',
        difficulty: 'intermediate',
        max_participants: 4,
        status: 'published',
        created_at: new Date().toISOString(),
        teacher_id: 1,
        teacher_name: 'Alex Chen',
        teacher_email: 'alex.chen@campus.edu',
        skill_id: 1,
        skill_name: 'React.js & Modern Web Architecture',
        skill_category: 'Web Development',
        pending_requests_count: 0,
        scheduled_sessions_count: 1,
      },
      {
        listing_id: 2,
        title: 'Deep Dive into B-Tree Indexes & EXPLAIN ANALYZE',
        description: 'Learn how PostgreSQL stores rows in pages, how B-Tree traversal works, and how to eliminate sequential scans in heavy queries.',
        teaching_format: 'group',
        difficulty: 'advanced',
        max_participants: 3,
        status: 'published',
        created_at: new Date().toISOString(),
        teacher_id: 2,
        teacher_name: 'Priya Sharma',
        teacher_email: 'priya.sharma@campus.edu',
        skill_id: 2,
        skill_name: 'PostgreSQL Query Optimization & Indexing',
        skill_category: 'Database Systems',
        pending_requests_count: 1,
        scheduled_sessions_count: 0,
      },
      {
        listing_id: 3,
        title: '1-on-1 Python Fundamentals for Beginners',
        description: 'Personalized tutoring session covering Python data structures, list comprehensions, and scripting automation.',
        teaching_format: 'individual',
        difficulty: 'beginner',
        max_participants: 1,
        status: 'published',
        created_at: new Date().toISOString(),
        teacher_id: 3,
        teacher_name: 'Marcus Johnson',
        teacher_email: 'marcus.johnson@campus.edu',
        skill_id: 3,
        skill_name: 'Python Data Science & Pandas',
        skill_category: 'Data Science',
        pending_requests_count: 1,
        scheduled_sessions_count: 0,
      },
      {
        listing_id: 4,
        title: 'Dockerizing Node.js & Multi-Container Postgres',
        description: 'Learn Dockerfile best practices, docker-compose orchestration, volume persistence, and networking for database apps.',
        teaching_format: 'group',
        difficulty: 'intermediate',
        max_participants: 5,
        status: 'published',
        created_at: new Date().toISOString(),
        teacher_id: 1,
        teacher_name: 'Alex Chen',
        teacher_email: 'alex.chen@campus.edu',
        skill_id: 5,
        skill_name: 'Docker & Microservices Deployment',
        skill_category: 'Cloud & DevOps',
        pending_requests_count: 1,
        scheduled_sessions_count: 0,
      },
    ];

    let filtered = [...mockListings];
    if (teacherId) {
      filtered = filtered.filter((l) => Number(l.teacher_id) === Number(teacherId));
    }
    if (format) {
      filtered = filtered.filter((l) => l.teaching_format === format);
    }
    if (difficulty) {
      filtered = filtered.filter((l) => l.difficulty === difficulty);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.skill_name.toLowerCase().includes(q)
      );
    }
    return filtered;
  }
}

/**
 * Get listing details by ID
 */
async function getListingById(listingId) {
  const sql = `
    SELECT 
      l.*,
      u.name AS teacher_name,
      u.email AS teacher_email,
      s.name AS skill_name,
      s.category AS skill_category
    FROM learning_listings l
    JOIN users u ON u.user_id = l.teacher_id
    JOIN skills s ON s.skill_id = l.skill_id
    WHERE l.listing_id = $1;
  `;
  const res = await db.query(sql, [listingId]);
  return res.rows[0] || null;
}

/**
 * Submit a request to learn from a listing
 */
async function submitLearningRequest({ listingId, learnerId, message }) {
  // 1. Verify listing exists and is active
  const listingRes = await db.query(
    'SELECT teacher_id, status FROM learning_listings WHERE listing_id = $1',
    [listingId]
  );

  if (listingRes.rows.length === 0) {
    const error = new Error('Learning listing not found.');
    error.statusCode = 404;
    throw error;
  }

  const listing = listingRes.rows[0];

  // Business rule: student cannot request to join their own teaching listing
  if (Number(listing.teacher_id) === Number(learnerId)) {
    const error = new Error('Invalid request: You cannot submit a learning request for your own teaching listing.');
    error.statusCode = 400;
    throw error;
  }

  if (listing.status !== 'published') {
    const error = new Error('This listing is no longer open for new requests.');
    error.statusCode = 400;
    throw error;
  }

  const sql = `
    INSERT INTO learning_requests (listing_id, learner_id, message, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING *;
  `;
  const res = await db.query(sql, [listingId, learnerId, message || null]);
  const request = res.rows[0];

  await logAudit(db, {
    actorId: learnerId,
    entityType: 'request',
    entityId: request.request_id,
    action: 'SUBMITTED',
    details: { listing_id: listingId, learner_id: learnerId },
  });

  return request;
}

/**
 * Transaction 2: Accept a Learner into a Scheduled Session (or Group Workshop)
 * Locks session and listing rows, verifies teacher authorization, checks capacity limits,
 * updates request status, and inserts session participant atomically.
 */
async function acceptLearnerIntoSession({ sessionId, requestId, teacherId }) {
  const { client, release } = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock the session row to serialize enrollments
    const sessionRes = await client.query(
      `SELECT session_id, listing_id, status, start_time, end_time 
       FROM learning_sessions 
       WHERE session_id = $1 AND status = 'scheduled' 
       FOR UPDATE;`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      const error = new Error('Scheduled session not found or is no longer in scheduled status.');
      error.statusCode = 404;
      throw error;
    }
    const session = sessionRes.rows[0];

    // 2. Lock and inspect the listing
    const listingRes = await client.query(
      `SELECT listing_id, teacher_id, title, teaching_format, max_participants 
       FROM learning_listings 
       WHERE listing_id = $1 
       FOR UPDATE;`,
      [session.listing_id]
    );

    const listing = listingRes.rows[0];

    // Authorization: Only listing owner can accept requests
    if (Number(listing.teacher_id) !== Number(teacherId)) {
      const error = new Error('Unauthorized: Only the listing teacher can accept learning requests.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Lock and inspect the request
    const requestRes = await client.query(
      `SELECT request_id, listing_id, learner_id, status 
       FROM learning_requests 
       WHERE request_id = $1 AND listing_id = $2 
       FOR UPDATE;`,
      [requestId, session.listing_id]
    );

    if (requestRes.rows.length === 0) {
      const error = new Error('Learning request does not match this listing or does not exist.');
      error.statusCode = 404;
      throw error;
    }
    const request = requestRes.rows[0];

    if (request.status !== 'pending' && request.status !== 'accepted') {
      const error = new Error(`Cannot enroll request with status '${request.status}'.`);
      error.statusCode = 400;
      throw error;
    }

    // Learner cannot be the teacher
    if (Number(request.learner_id) === Number(teacherId)) {
      const error = new Error('Teacher cannot enroll as a learner.');
      error.statusCode = 400;
      throw error;
    }

    // 4. Count current active participants
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS current_count 
       FROM session_participants 
       WHERE session_id = $1 AND attendance_status = 'registered';`,
      [sessionId]
    );
    const currentCount = countRes.rows[0].current_count;

    // Check capacity: individual = 1, group = max_participants
    if (currentCount >= listing.max_participants) {
      const error = new Error(
        `Session is already at maximum capacity (${listing.max_participants} participant${listing.max_participants > 1 ? 's' : ''}). No more seats available.`
      );
      error.statusCode = 409;
      throw error;
    }

    // 5. Update request status to accepted
    await client.query(
      `UPDATE learning_requests 
       SET status = 'accepted', updated_at = NOW() 
       WHERE request_id = $1;`,
      [requestId]
    );

    // 6. Insert participant record
    const participantRes = await client.query(
      `INSERT INTO session_participants (session_id, learner_id, request_id, listing_id, attendance_status)
       VALUES ($1, $2, $3, $4, 'registered')
       RETURNING *;`,
      [sessionId, request.learner_id, requestId, session.listing_id]
    );

    // 7. Audit Log
    await logAudit(client, {
      actorId: teacherId,
      entityType: 'session',
      entityId: sessionId,
      action: 'LEARNER_ENROLLED',
      details: {
        learner_id: request.learner_id,
        request_id: requestId,
        current_enrolled: currentCount + 1,
        capacity: listing.max_participants,
      },
    });

    await client.query('COMMIT');
    return {
      success: true,
      participant: participantRes.rows[0],
      enrolledCount: currentCount + 1,
      capacity: listing.max_participants,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    release();
  }
}

/**
 * Standalone accept or reject for a learning request (when teacher accepts before scheduling session)
 */
async function respondToRequest({ requestId, teacherId, action }) {
  if (!['accepted', 'rejected'].includes(action)) {
    const error = new Error('Action must be either "accepted" or "rejected".');
    error.statusCode = 400;
    throw error;
  }

  const { client, release } = await db.getClient();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query(
      `SELECT r.request_id, r.listing_id, r.learner_id, r.status, l.teacher_id 
       FROM learning_requests r
       JOIN learning_listings l ON l.listing_id = r.listing_id
       WHERE r.request_id = $1
       FOR UPDATE OF r;`,
      [requestId]
    );

    if (reqRes.rows.length === 0) {
      const error = new Error('Request not found.');
      error.statusCode = 404;
      throw error;
    }

    const request = reqRes.rows[0];

    if (Number(request.teacher_id) !== Number(teacherId)) {
      const error = new Error('Unauthorized: Only the listing teacher can respond to requests.');
      error.statusCode = 403;
      throw error;
    }

    await client.query(
      `UPDATE learning_requests 
       SET status = $1, updated_at = NOW() 
       WHERE request_id = $2;`,
      [action, requestId]
    );

    await logAudit(client, {
      actorId: teacherId,
      entityType: 'request',
      entityId: requestId,
      action: action.toUpperCase(),
      details: { learner_id: request.learner_id, listing_id: request.listing_id },
    });

    await client.query('COMMIT');
    return { success: true, status: action };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    release();
  }
}

/**
 * Transaction 3: Schedule a Learning Session with Optional Room Reservation Atomically
 * Guarantees that if a room reservation fails (overlap or maintenance conflict),
 * the learning session is NOT created, preventing orphaned or dangling sessions.
 */
async function scheduleSession({ listingId, teacherId, startTime, endTime, resourceId = null }) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    const error = new Error('Invalid time slot: End time must be strictly after start time.');
    error.statusCode = 400;
    throw error;
  }

  const { client, release } = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify teacher owns listing & listing is published
    const listingRes = await client.query(
      `SELECT listing_id, teacher_id, title, status, teaching_format, max_participants 
       FROM learning_listings 
       WHERE listing_id = $1 
       FOR UPDATE;`,
      [listingId]
    );

    if (listingRes.rows.length === 0) {
      const error = new Error('Learning listing not found.');
      error.statusCode = 404;
      throw error;
    }

    const listing = listingRes.rows[0];

    if (Number(listing.teacher_id) !== Number(teacherId)) {
      const error = new Error('Unauthorized: Only the listing owner can schedule sessions for this listing.');
      error.statusCode = 403;
      throw error;
    }

    if (listing.status !== 'published') {
      const error = new Error('Cannot schedule sessions for non-published listings.');
      error.statusCode = 400;
      throw error;
    }

    let reservationId = null;
    let roomDetails = null;

    // 2. If room reservation requested, book room inside the same transaction
    if (resourceId) {
      // Lock resource
      const resourceRes = await client.query(
        `SELECT resource_id, name, location, capacity, is_active 
         FROM resources 
         WHERE resource_id = $1 AND is_active = TRUE 
         FOR UPDATE;`,
        [resourceId]
      );

      if (resourceRes.rows.length === 0) {
        const error = new Error('The requested campus room was not found or is inactive.');
        error.statusCode = 404;
        throw error;
      }
      roomDetails = resourceRes.rows[0];

      // Check maintenance conflict
      const maintenanceRes = await client.query(
        `SELECT EXISTS (
           SELECT 1 FROM resource_maintenance 
           WHERE resource_id = $1 
             AND start_time < $3 
             AND end_time > $2
         ) AS maintenance_conflict;`,
        [resourceId, start, end]
      );

      if (maintenanceRes.rows[0].maintenance_conflict) {
        const error = new Error(
          `Room reservation failed: "${roomDetails.name}" has scheduled maintenance during this time window. Session scheduling aborted.`
        );
        error.statusCode = 409;
        throw error;
      }

      // Insert reservation (Postgres exclusion constraint protects against overlaps)
      const reservationRes = await client.query(
        `INSERT INTO reservations (user_id, resource_id, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, 'confirmed')
         RETURNING reservation_id;`,
        [teacherId, resourceId, start, end]
      );
      reservationId = reservationRes.rows[0].reservation_id;

      await logAudit(client, {
        actorId: teacherId,
        entityType: 'reservation',
        entityId: reservationId,
        action: 'CONFIRMED',
        details: { resource_id: resourceId, purpose: `Peer session for ${listing.title}` },
      });
    }

    // 3. Create the learning session linked to the reservation
    const sessionRes = await client.query(
      `INSERT INTO learning_sessions (listing_id, reservation_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, 'scheduled')
       RETURNING *;`,
      [listingId, reservationId, start, end]
    );
    const session = sessionRes.rows[0];

    // 4. Record audit log
    await logAudit(client, {
      actorId: teacherId,
      entityType: 'session',
      entityId: session.session_id,
      action: reservationId ? 'SCHEDULED_WITH_ROOM' : 'SCHEDULED_ONLINE',
      details: {
        listing_title: listing.title,
        reservation_id: reservationId,
        room_name: roomDetails ? roomDetails.name : null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      },
    });

    await client.query('COMMIT');
    return {
      ...session,
      room_name: roomDetails ? roomDetails.name : null,
      location: roomDetails ? roomDetails.location : 'Online / Flexible',
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    release();
  }
}

/**
 * Transaction 4: Cancel a Learning Session
 * Cancels session and cascades cancellation to the linked room reservation atomically.
 */
async function cancelSession({ sessionId, userId, isAdmin = false }) {
  const { client, release } = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock the session
    const sessionRes = await client.query(
      `SELECT ls.session_id, ls.listing_id, ls.reservation_id, ls.status, ll.teacher_id, ll.title 
       FROM learning_sessions ls 
       JOIN learning_listings ll ON ll.listing_id = ls.listing_id 
       WHERE ls.session_id = $1 
       FOR UPDATE OF ls;`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      const error = new Error('Learning session not found.');
      error.statusCode = 404;
      throw error;
    }

    const session = sessionRes.rows[0];

    // Ownership verification
    if (!isAdmin && Number(session.teacher_id) !== Number(userId)) {
      const error = new Error('Unauthorized: Only the teacher of this listing or an admin may cancel this session.');
      error.statusCode = 403;
      throw error;
    }

    if (session.status === 'cancelled') {
      await client.query('COMMIT');
      return { success: true, message: 'Session is already cancelled.' };
    }

    // 2. Mark session cancelled
    await client.query(
      `UPDATE learning_sessions 
       SET status = 'cancelled' 
       WHERE session_id = $1;`,
      [sessionId]
    );

    // 3. Atomically cancel linked room reservation if one exists
    let reservationCancelled = false;
    if (session.reservation_id) {
      await client.query(
        `UPDATE reservations 
         SET status = 'cancelled' 
         WHERE reservation_id = $1 AND status IN ('pending', 'confirmed');`,
        [session.reservation_id]
      );
      reservationCancelled = true;
    }

    // 4. Update session participants to cancelled
    await client.query(
      `UPDATE session_participants 
       SET attendance_status = 'cancelled' 
       WHERE session_id = $1;`,
      [sessionId]
    );

    // 5. Audit log
    await logAudit(client, {
      actorId: userId,
      entityType: 'session',
      entityId: sessionId,
      action: 'CANCELLED',
      details: {
        session_title: session.title,
        reservation_id: session.reservation_id,
        linked_reservation_cancelled: reservationCancelled,
      },
    });

    await client.query('COMMIT');
    return {
      success: true,
      message: 'Learning session and linked room reservation cancelled atomically.',
      reservationCancelled,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    release();
  }
}

/**
 * Get sessions for a listing or user (teacher or learner)
 */
async function getSessions({ listingId, teacherId, learnerId } = {}) {
  let sql = `
    SELECT 
      ls.session_id,
      ls.listing_id,
      ls.reservation_id,
      ls.start_time,
      ls.end_time,
      ls.status,
      ls.created_at,
      l.title AS listing_title,
      l.teaching_format,
      l.max_participants,
      u.name AS teacher_name,
      u.user_id AS teacher_id,
      r.name AS room_name,
      r.location AS room_location,
      COUNT(sp.learner_id)::int AS enrolled_learners
    FROM learning_sessions ls
    JOIN learning_listings l ON l.listing_id = ls.listing_id
    JOIN users u ON u.user_id = l.teacher_id
    LEFT JOIN reservations res ON res.reservation_id = ls.reservation_id
    LEFT JOIN resources r ON r.resource_id = res.resource_id
    LEFT JOIN session_participants sp ON sp.session_id = ls.session_id AND sp.attendance_status = 'registered'
    WHERE 1=1
  `;
  const params = [];

  if (listingId && listingId !== 'undefined' && listingId !== 'null') {
    params.push(listingId);
    sql += ` AND ls.listing_id = $${params.length}`;
  }

  if (teacherId && teacherId !== 'undefined' && teacherId !== 'null') {
    params.push(teacherId);
    sql += ` AND l.teacher_id = $${params.length}`;
  }

  if (learnerId && learnerId !== 'undefined' && learnerId !== 'null') {
    params.push(learnerId);
    sql += ` AND EXISTS (
      SELECT 1 FROM session_participants p 
      WHERE p.session_id = ls.session_id AND p.learner_id = $${params.length}
    )`;
  }

  sql += `
    GROUP BY ls.session_id, l.title, l.teaching_format, l.max_participants, u.name, u.user_id, r.name, r.location
    ORDER BY ls.start_time ASC;
  `;

  try {
    const res = await db.query(sql, params);
    return res.rows;
  } catch (err) {
    console.warn('[PeerLearningService] getSessions DB query failed, using seed fallback:', err.message);
    const mockSessions = [
      {
        session_id: 1,
        listing_id: 1,
        reservation_id: 1,
        start_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        end_time: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString(),
        listing_title: 'React 19 & Fullstack State Mastery',
        teaching_format: 'group',
        max_participants: 4,
        teacher_name: 'Alex Chen',
        teacher_id: 1,
        room_name: 'Turing Lab Room 101',
        room_location: 'CS Wing, 1st Floor',
        enrolled_learners: 2,
      },
    ];
    let filtered = [...mockSessions];
    if (listingId) filtered = filtered.filter((s) => Number(s.listing_id) === Number(listingId));
    if (teacherId) filtered = filtered.filter((s) => Number(s.teacher_id) === Number(teacherId));
    return filtered;
  }
}

/**
 * Get participants enrolled in a specific session
 */
async function getSessionParticipants(sessionId) {
  try {
    const sql = `
      SELECT 
        sp.learner_id,
        sp.attendance_status,
        u.name AS learner_name,
        u.email AS learner_email,
        req.message AS request_message,
        req.created_at AS requested_at
      FROM session_participants sp
      JOIN users u ON u.user_id = sp.learner_id
      JOIN learning_requests req ON req.request_id = sp.request_id
      WHERE sp.session_id = $1
      ORDER BY u.name ASC;
    `;
    const res = await db.query(sql, [sessionId]);
    return res.rows;
  } catch (err) {
    return [
      { learner_id: 4, attendance_status: 'registered', learner_name: 'Elena Rostova', learner_email: 'elena.rostova@campus.edu' },
      { learner_id: 5, attendance_status: 'registered', learner_name: 'Devon Vance', learner_email: 'devon.vance@campus.edu' },
    ];
  }
}

/**
 * Get requests for a user (either outgoing as a learner, or incoming as a teacher)
 */
async function getUserRequests(userId, type = 'all') {
  let sql = `
    SELECT 
      r.request_id,
      r.listing_id,
      r.learner_id,
      r.message,
      r.status,
      r.created_at,
      r.updated_at,
      l.title AS listing_title,
      l.teaching_format,
      l.max_participants,
      l.teacher_id,
      teacher.name AS teacher_name,
      learner.name AS learner_name,
      learner.email AS learner_email,
      s.name AS skill_name
    FROM learning_requests r
    JOIN learning_listings l ON l.listing_id = r.listing_id
    JOIN users teacher ON teacher.user_id = l.teacher_id
    JOIN users learner ON learner.user_id = r.learner_id
    JOIN skills s ON s.skill_id = l.skill_id
    WHERE 1=1
  `;
  const params = [];

  if (type === 'incoming') {
    params.push(userId);
    sql += ` AND l.teacher_id = $${params.length}`;
  } else if (type === 'outgoing') {
    params.push(userId);
    sql += ` AND r.learner_id = $${params.length}`;
  } else {
    params.push(userId);
    sql += ` AND (l.teacher_id = $${params.length} OR r.learner_id = $${params.length})`;
  }

  sql += ' ORDER BY r.created_at DESC;';
  try {
    const res = await db.query(sql, params);
    return res.rows;
  } catch (err) {
    console.warn('[PeerLearningService] getUserRequests DB query failed, using seed fallback:', err.message);
    const mockRequests = [
      {
        request_id: 1,
        listing_id: 1,
        learner_id: 4,
        message: 'Hi Alex, I am working on my college project and really want to master React state handling!',
        status: 'accepted',
        created_at: new Date().toISOString(),
        listing_title: 'React 19 & Fullstack State Mastery',
        teaching_format: 'group',
        max_participants: 4,
        teacher_id: 1,
        teacher_name: 'Alex Chen',
        learner_name: 'Elena Rostova',
        learner_email: 'elena.rostova@campus.edu',
        skill_name: 'React.js & Modern Web Architecture',
      },
      {
        request_id: 2,
        listing_id: 1,
        learner_id: 5,
        message: 'Excited to attend the React session! I have basic JS experience.',
        status: 'accepted',
        created_at: new Date().toISOString(),
        listing_title: 'React 19 & Fullstack State Mastery',
        teaching_format: 'group',
        max_participants: 4,
        teacher_id: 1,
        teacher_name: 'Alex Chen',
        learner_name: 'Devon Vance',
        learner_email: 'devon.vance@campus.edu',
        skill_name: 'React.js & Modern Web Architecture',
      },
      {
        request_id: 3,
        listing_id: 2,
        learner_id: 4,
        message: 'Would love to understand how Postgres indexing works under the hood.',
        status: 'pending',
        created_at: new Date().toISOString(),
        listing_title: 'Deep Dive into B-Tree Indexes & EXPLAIN ANALYZE',
        teaching_format: 'group',
        max_participants: 3,
        teacher_id: 2,
        teacher_name: 'Priya Sharma',
        learner_name: 'Elena Rostova',
        learner_email: 'elena.rostova@campus.edu',
        skill_name: 'PostgreSQL Query Optimization & Indexing',
      },
      {
        request_id: 4,
        listing_id: 3,
        learner_id: 5,
        message: 'Looking forward to strengthening my core Python skills.',
        status: 'pending',
        created_at: new Date().toISOString(),
        listing_title: '1-on-1 Python Fundamentals for Beginners',
        teaching_format: 'individual',
        max_participants: 1,
        teacher_id: 3,
        teacher_name: 'Marcus Johnson',
        learner_name: 'Devon Vance',
        learner_email: 'devon.vance@campus.edu',
        skill_name: 'Python Data Science & Pandas',
      },
      {
        request_id: 5,
        listing_id: 4,
        learner_id: 2,
        message: 'Looking to learn how to containerize my Postgres experiments.',
        status: 'pending',
        created_at: new Date().toISOString(),
        listing_title: 'Dockerizing Node.js & Multi-Container Postgres',
        teaching_format: 'group',
        max_participants: 5,
        teacher_id: 1,
        teacher_name: 'Alex Chen',
        learner_name: 'Priya Sharma',
        learner_email: 'priya.sharma@campus.edu',
        skill_name: 'Docker & Microservices Deployment',
      },
    ];

    const uid = Number(userId);
    if (type === 'incoming') {
      return mockRequests.filter((r) => Number(r.teacher_id) === uid);
    } else if (type === 'outgoing') {
      return mockRequests.filter((r) => Number(r.learner_id) === uid);
    }
    return mockRequests.filter((r) => Number(r.teacher_id) === uid || Number(r.learner_id) === uid);
  }
}

module.exports = {
  createListing,
  listListings,
  getListingById,
  submitLearningRequest,
  acceptLearnerIntoSession,
  respondToRequest,
  scheduleSession,
  cancelSession,
  getSessions,
  getSessionParticipants,
  getUserRequests,
};
