const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/auth');

router.get('/skills', listingController.listSkills);
router.get('/', listingController.listListings);
router.get('/:listingId', listingController.getListingById);
router.post('/', authenticate, listingController.createListing);

module.exports = router;
