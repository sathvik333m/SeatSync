const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', requestController.submitRequest);
router.get('/my', requestController.getUserRequests);
router.patch('/:requestId/respond', requestController.respondToRequest);

module.exports = router;
