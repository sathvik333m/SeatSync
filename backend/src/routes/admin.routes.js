const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// System statistics can be viewed by authenticated users
router.get('/stats', authenticate, adminController.getSystemStats);
router.get('/maintenance', authenticate, adminController.listMaintenance);

// Resource creation & maintenance scheduling restricted to Admin
router.post('/resources', authenticate, requireRole('admin'), adminController.createResource);
router.post('/maintenance', authenticate, requireRole('admin'), adminController.scheduleMaintenance);

module.exports = router;
