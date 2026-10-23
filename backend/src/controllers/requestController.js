const peerLearningService = require('../services/peerLearningService');

async function submitRequest(req, res, next) {
  try {
    const learnerId = req.user.user_id;
    const { listingId, message } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'listingId is required.',
      });
    }

    const request = await peerLearningService.submitLearningRequest({
      listingId,
      learnerId,
      message,
    });

    return res.status(201).json({
      success: true,
      message: 'Learning request submitted to the teacher successfully.',
      data: request,
    });
  } catch (err) {
    next(err);
  }
}

async function respondToRequest(req, res, next) {
  try {
    const teacherId = req.user.user_id;
    const { requestId } = req.params;
    const { action } = req.body; // 'accepted' or 'rejected'

    const result = await peerLearningService.respondToRequest({
      requestId,
      teacherId,
      action,
    });

    return res.json({
      success: true,
      message: `Request has been marked as ${action}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getUserRequests(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { type } = req.query; // 'incoming', 'outgoing', 'all'
    const requests = await peerLearningService.getUserRequests(userId, type);
    return res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitRequest,
  respondToRequest,
  getUserRequests,
};
