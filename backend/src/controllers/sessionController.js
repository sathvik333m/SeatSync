const peerLearningService = require('../services/peerLearningService');

/**
 * Endpoint for Transaction 3: Schedule a session with optional room atomically
 */
async function scheduleSession(req, res, next) {
  try {
    const teacherId = req.user.user_id;
    const { listingId, startTime, endTime, resourceId } = req.body;

    if (!listingId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'listingId, startTime, and endTime are required.',
      });
    }

    const session = await peerLearningService.scheduleSession({
      listingId,
      teacherId,
      startTime,
      endTime,
      resourceId: resourceId ? parseInt(resourceId, 10) : null,
    });

    return res.status(201).json({
      success: true,
      message: session.room_name
        ? `Session scheduled and room "${session.room_name}" reserved atomically.`
        : 'Online learning session scheduled successfully.',
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Endpoint for Transaction 2: Accept learner into scheduled workshop
 */
async function enrollLearner(req, res, next) {
  try {
    const teacherId = req.user.user_id;
    const { sessionId } = req.params;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'requestId is required.',
      });
    }

    const result = await peerLearningService.acceptLearnerIntoSession({
      sessionId,
      requestId,
      teacherId,
    });

    return res.json({
      success: true,
      message: `Learner accepted into session (${result.enrolledCount}/${result.capacity} seats filled).`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Endpoint for Transaction 4: Cancel learning session
 */
async function cancelSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const userId = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    const result = await peerLearningService.cancelSession({
      sessionId,
      userId,
      isAdmin,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listSessions(req, res, next) {
  try {
    const { listingId, teacherId, learnerId } = req.query;
    const sessions = await peerLearningService.getSessions({
      listingId,
      teacherId,
      learnerId,
    });
    return res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    next(err);
  }
}

async function getSessionParticipants(req, res, next) {
  try {
    const { sessionId } = req.params;
    const participants = await peerLearningService.getSessionParticipants(sessionId);
    return res.json({ success: true, count: participants.length, data: participants });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  scheduleSession,
  enrollLearner,
  cancelSession,
  listSessions,
  getSessionParticipants,
};
