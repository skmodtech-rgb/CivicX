const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Redemption = require('../models/Redemption');

// ─── Global Activity ─────────────────────────────────────
// @route   GET /api/activity/global
// @desc    Latest reports from all users
router.get('/global', async (req, res) => {
  try {
    const latest = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name avatar level tier');
    
    res.json(latest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── My Activity (Personal History) ──────────────────────
// @route   GET /api/activity/me
// @desc    Chronological history of complaints, points, and milestones
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get all complaints by user
    const complaints = await Complaint.find({ userId })
      .sort({ createdAt: -1 });

    // 2. Get all redemptions
    const redemptions = await Redemption.find({ user: userId })
      .sort({ createdAt: -1 });

    // 3. Construct a chronological feed
    let feed = [];

    // Add complaints as events
    complaints.forEach(c => {
      feed.push({
        type: 'complaint',
        title: c.title,
        status: c.status,
        date: c.createdAt,
        points: 50, // Standard points for reporting
        id: c._id
      });

      if (c.status === 'resolved') {
        feed.push({
          type: 'resolution',
          title: `Resolution: ${c.title}`,
          date: c.updatedAt,
          points: 100,
          id: `${c._id}-res`
        });
      }
    });

    // Add redemptions
    redemptions.forEach(r => {
      feed.push({
        type: 'redemption',
        title: `Redeemed: ${r.voucherName}`,
        status: r.status,
        date: r.createdAt,
        points: -r.pointsCost,
        id: r._id
      });
    });

    // Add Milestone events (Mocked from current user state for demo)
    const user = await User.findById(userId);
    user.badges.forEach(b => {
      feed.push({
        type: 'badge',
        title: `Earned Badge: ${b.name}`,
        icon: b.icon,
        date: b.earnedAt,
        id: `badge-${b.name}`
      });
    });

    // Sort all by date
    feed.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      stats: {
        totalPoints: user.totalPointsEarned,
        availablePoints: user.points,
        level: user.level,
        tier: user.tier,
        complaintsCount: user.complaintsSubmitted,
        resolutionRate: user.complaintsSubmitted > 0 
          ? Math.round((user.complaintsResolved / user.complaintsSubmitted) * 100) 
          : 0
      },
      feed
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
