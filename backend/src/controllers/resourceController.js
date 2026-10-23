const reservationService = require('../services/reservationService');

async function listResources(req, res, next) {
  try {
    const { type, minCapacity } = req.query;
    const resources = await reservationService.listResources({ type, minCapacity });
    return res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    next(err);
  }
}

async function getResourceSchedule(req, res, next) {
  try {
    const { resourceId } = req.params;
    const { date } = req.query;
    const schedule = await reservationService.getResourceSchedule(resourceId, date);
    return res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
}

/**
 * Endpoint for Transaction 1: Safe Resource Reservation
 */
async function createReservation(req, res, next) {
  try {
    const { resourceId, startTime, endTime, purpose } = req.body;
    const userId = req.user.user_id;

    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'resourceId, startTime, and endTime are required.',
      });
    }

    const reservation = await reservationService.createReservation({
      userId,
      resourceId,
      startTime,
      endTime,
      purpose,
    });

    return res.status(201).json({
      success: true,
      message: 'Campus resource reserved successfully. Overlap and maintenance checks passed.',
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const { reservationId } = req.params;
    const userId = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    const result = await reservationService.cancelReservation(reservationId, userId, isAdmin);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getMyReservations(req, res, next) {
  try {
    const userId = req.user.user_id;
    const reservations = await reservationService.getUserReservations(userId);
    return res.json({ success: true, count: reservations.length, data: reservations });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listResources,
  getResourceSchedule,
  createReservation,
  cancelReservation,
  getMyReservations,
};
