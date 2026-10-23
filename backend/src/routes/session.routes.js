const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');

// Publicly viewable upcoming sessions
router.get('/', sessionController.listSessions);
router.get('/:sessionId/participants', sessionController.getSessionParticipants);

// Protected actions
router.post('/schedule', authenticate, sessionController.scheduleSession);
router.post('/:sessionId/enroll', authenticate, sessionController.enrollLearner);
router.delete('/:sessionId', authenticate, sessionController.cancelSession);

module.exports = router;
