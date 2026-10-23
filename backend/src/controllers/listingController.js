const peerLearningService = require('../services/peerLearningService');
const db = require('../config/db');

async function listSkills(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM skills ORDER BY category, name ASC;');
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.warn('[ListingController] listSkills DB query failed, using seed fallback:', err.message);
    const fallbackSkills = [
      { skill_id: 1, name: 'React.js & Modern Web Architecture', category: 'Web Development' },
      { skill_id: 2, name: 'PostgreSQL Query Optimization & Indexing', category: 'Database Systems' },
      { skill_id: 3, name: 'Python Data Science & Pandas', category: 'Data Science' },
      { skill_id: 4, name: 'Rust Systems & Memory Safety', category: 'Systems Programming' },
      { skill_id: 5, name: 'Docker & Microservices Deployment', category: 'Cloud & DevOps' },
      { skill_id: 6, name: 'Algorithm Design & Competitive Coding', category: 'Computer Science' },
    ];
    return res.json({ success: true, count: fallbackSkills.length, data: fallbackSkills });
  }
}

async function createListing(req, res, next) {
  try {
    const teacherId = req.user.user_id;
    const { skillId, title, description, teachingFormat, difficulty, maxParticipants } = req.body;

    if (!skillId || !title || !description || !teachingFormat || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'skillId, title, description, teachingFormat, and difficulty are required.',
      });
    }

    const listing = await peerLearningService.createListing({
      teacherId,
      skillId,
      title,
      description,
      teachingFormat,
      difficulty,
      maxParticipants,
    });

    return res.status(201).json({
      success: true,
      message: 'Learning offer published successfully.',
      data: listing,
    });
  } catch (err) {
    next(err);
  }
}

async function listListings(req, res, next) {
  try {
    const { search, skillId, category, format, difficulty, teacherId } = req.query;
    const listings = await peerLearningService.listListings({
      search,
      skillId,
      category,
      format,
      difficulty,
      teacherId,
    });
    return res.json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    next(err);
  }
}

async function getListingById(req, res, next) {
  try {
    const { listingId } = req.params;
    const listing = await peerLearningService.getListingById(listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Learning listing not found.',
      });
    }

    return res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSkills,
  createListing,
  listListings,
  getListingById,
};
