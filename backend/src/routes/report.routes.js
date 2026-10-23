const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// Evaluation reports (public or accessible for college project demo)
router.get('/skills', reportController.getPopularSkills);
router.get('/upcoming-sessions', reportController.getUpcomingSessions);
router.get('/leaderboard', reportController.getLeaderboard);
router.get('/resource-demand', reportController.getResourceDemand);
router.get('/pending-requests', authenticate, reportController.getTeacherPendingRequests);
router.get('/audit-logs', reportController.getAuditLogs);
router.get('/explain-analyze', reportController.getExplainAnalyze);

module.exports = router;
