/**
 * Central Error Handler Middleware
 * Maps PostgreSQL internal constraint codes directly to user-friendly and DBMS-informative responses.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Details]:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    table: err.table,
    constraint: err.constraint,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // 1. PostgreSQL Exclusion Constraint Violation (Error Code 23P01)
  // Triggered by GiST exclusion constraint on overlapping reservations
  if (err.code === '23P01') {
    return res.status(409).json({
      success: false,
      error: 'ConflictOverlappingReservation',
      dbmsRule: 'PostgreSQL EXCLUDE USING gist (resource_id WITH =, tstzrange(start_time, end_time, \'[)\') WITH &&)',
      message: 'Booking conflict: The requested campus resource is already reserved for this time window. Overlapping reservations are prevented at the database engine level.',
      detail: err.detail,
    });
  }

  // 2. PostgreSQL Unique Constraint Violation (Error Code 23505)
  if (err.code === '23505') {
    let message = 'A record with these unique details already exists.';
    if (err.constraint === 'users_email_key') {
      message = 'An account with this email address is already registered.';
    } else if (err.constraint?.includes('learning_requests')) {
      message = 'You have already submitted an active request for this learning listing.';
    } else if (err.constraint?.includes('learning_sessions_reservation_id_key')) {
      message = 'This room reservation is already linked to another scheduled session.';
    } else if (err.constraint?.includes('session_participants_pkey')) {
      message = 'Learner is already enrolled in this scheduled session.';
    }

    return res.status(409).json({
      success: false,
      error: 'DuplicateResource',
      dbmsRule: `UNIQUE constraint '${err.constraint}' violated`,
      message,
      detail: err.detail,
    });
  }

  // 3. PostgreSQL Check Constraint Violation (Error Code 23514)
  if (err.code === '23514') {
    let message = 'Validation rule failed in database check constraint.';
    if (err.constraint?.includes('end_time')) {
      message = 'Invalid time range: End time must be strictly later than start time.';
    } else if (err.constraint?.includes('max_participants') || err.constraint?.includes('capacity')) {
      message = 'Capacity rule violated: Group sessions must have 2+ participants, and capacity must be positive.';
    }

    return res.status(400).json({
      success: false,
      error: 'CheckConstraintViolation',
      dbmsRule: `CHECK constraint '${err.constraint}' failed`,
      message,
    });
  }

  // 4. PostgreSQL Foreign Key Constraint Violation (Error Code 23503)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'ForeignKeyViolation',
      dbmsRule: `FOREIGN KEY '${err.constraint}' failed on table '${err.table}'`,
      message: 'The referenced user, resource, skill, or session does not exist in the database.',
      detail: err.detail,
    });
  }

  // 5. PostgreSQL Deadlock Detected (Error Code 40P01)
  if (err.code === '40P01') {
    return res.status(409).json({
      success: false,
      error: 'DeadlockDetected',
      dbmsRule: 'PostgreSQL deadlock detector aborted the transaction to preserve consistency',
      message: 'Concurrent resource contention detected. Please retry your request.',
    });
  }

  // 6. Custom Application Errors (with statusCode)
  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.',
  });
}

module.exports = { errorHandler };
