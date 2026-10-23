const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authenticate } = require('../middleware/auth');

// Public or student-accessible routes
router.get('/', resourceController.listResources);
router.get('/:resourceId/schedule', resourceController.getResourceSchedule);

// Protected routes (requires login)
router.post('/reserve', authenticate, resourceController.createReservation);
router.delete('/reservations/:reservationId', authenticate, resourceController.cancelReservation);
router.get('/my/reservations', authenticate, resourceController.getMyReservations);

module.exports = router;
