const reportService = require('../services/reportService');

async function getPopularSkills(req, res, next) {
  try {
    const data = await reportService.getPopularSkills();
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getUpcomingSessions(req, res, next) {
  try {
    const data = await reportService.getUpcomingSessions();
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getLeaderboard(req, res, next) {
  try {
    const data = await reportService.getLeaderboard();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getResourceDemand(req, res, next) {
  try {
    const data = await reportService.getResourceDemand();
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getTeacherPendingRequests(req, res, next) {
  try {
    const teacherId = req.query.teacherId || req.user?.user_id;
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'teacherId is required.',
      });
    }
    const data = await reportService.getTeacherPendingRequests(teacherId);
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { entityType, limit } = req.query;
    const data = await reportService.getAuditLogs({ entityType, limit });
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getExplainAnalyze(req, res, next) {
  try {
    const data = await reportService.runExplainAnalyze();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPopularSkills,
  getUpcomingSessions,
  getLeaderboard,
  getResourceDemand,
  getTeacherPendingRequests,
  getAuditLogs,
  getExplainAnalyze,
};
