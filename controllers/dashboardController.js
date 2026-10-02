const Ticket = require('../models/Ticket');
const User = require('../models/User');

/**
 * @desc    Get Admin Dashboard Statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin only)
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    // 1. Total tickets count
    const total = await Ticket.countDocuments();

    // 2. Count grouped by status
    const statusAgg = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatus = {
      Pending: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0
    };
    statusAgg.forEach((item) => {
      if (item._id) byStatus[item._id] = item.count;
    });

    // 3. Count grouped by priority
    const priorityAgg = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const byPriority = {
      High: 0,
      Medium: 0,
      Low: 0
    };
    priorityAgg.forEach((item) => {
      if (item._id) byPriority[item._id] = item.count;
    });

    // 4. Tickets in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await Ticket.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // 5. Total registered users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // 6. 5 most recent tickets
    const recentTickets = await Ticket.find()
      .populate('createdBy', 'name email department')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byPriority,
        last7Days,
        totalUsers,
        recentTickets
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get User Dashboard Statistics (Own tickets)
 * @route   GET /api/dashboard/user-stats
 * @access  Private (User/Admin)
 */
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const total = await Ticket.countDocuments({ createdBy: userId });

    const statusAgg = await Ticket.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const byStatus = {
      Pending: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0
    };

    statusAgg.forEach((item) => {
      if (item._id) byStatus[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus
      }
    });
  } catch (err) {
    next(err);
  }
};
