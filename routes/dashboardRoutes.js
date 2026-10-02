const express = require('express');
const { getAdminStats, getUserStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// User dashboard stats (own tickets)
router.get('/user-stats', protect, getUserStats);

// Admin dashboard stats (all tickets & users)
router.get('/stats', protect, authorize('admin'), getAdminStats);

module.exports = router;
