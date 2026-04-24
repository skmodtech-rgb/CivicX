const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats — Dashboard Statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingCount = await Complaint.countDocuments({ status: 'pending' });
    const assignedCount = await Complaint.countDocuments({ status: 'assigned' });
    const inProgressCount = await Complaint.countDocuments({ status: 'in_progress' });
    const resolvedCount = await Complaint.countDocuments({ status: 'resolved' });
    const rejectedCount = await Complaint.countDocuments({ status: 'rejected' });
    const totalUsers = await User.countDocuments({ role: 'citizen' });

    // Average resolution time (for resolved complaints)
    const resolvedComplaints = await Complaint.find({ status: 'resolved', resolvedAt: { $exists: true } });
    let avgResolutionMs = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionMs = totalMs / resolvedComplaints.length;
    }
    const avgResolutionHours = Math.round(avgResolutionMs / (1000 * 60 * 60));

    // Category breakdown
    const categoryBreakdown = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Urgency breakdown
    const urgencyBreakdown = await Complaint.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } }
    ]);

    // Recent trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats: {
        totalComplaints,
        pending: pendingCount,
        assigned: assignedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
        totalUsers,
        avgResolutionHours,
        resolutionRate: totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0
      },
      categoryBreakdown,
      urgencyBreakdown,
      dailyTrend
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/complaints — All complaints for management
router.get('/complaints', adminAuth, async (req, res) => {
  try {
    const { status, category, urgency, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email avatar level tier')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({ complaints, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/complaints/:id — Update complaint status
router.put('/complaints/:id', adminAuth, async (req, res) => {
  try {
    const { status, assignedTo, adminNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (status) complaint.status = status;
    if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
    if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
    if (req.body.department) complaint.department = req.body.department;

    // If resolved, set resolvedAt and award points to reporter
    if (status === 'resolved' && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();

      const reporter = await User.findById(complaint.user);
      if (reporter) {
        reporter.awardPoints(100);
        reporter.complaintsResolved += 1;

        // Badge: "Problem Solver" at 5 resolved
        if (reporter.complaintsResolved >= 5 && !reporter.badges.find(b => b.name === 'Problem Solver')) {
          reporter.badges.push({ name: 'Problem Solver', icon: '🏆' });
          reporter.awardPoints(75);
        }

        // Badge: "City Champion" at 20 resolved
        if (reporter.complaintsResolved >= 20 && !reporter.badges.find(b => b.name === 'City Champion')) {
          reporter.badges.push({ name: 'City Champion', icon: '👑' });
          reporter.awardPoints(75);
        }

        await reporter.save();
      }
    }

    // If complaint is verified (assigned), award verification points
    if (status === 'assigned' && complaint.status === 'pending') {
      const reporter = await User.findById(complaint.user);
      if (reporter) {
        reporter.awardPoints(30);
        await reporter.save();
      }
    }

    await complaint.save();

    const updated = await Complaint.findById(complaint._id).populate('user', 'name email avatar level tier');
    res.json({ complaint: updated });
  } catch (error) {
    console.error('Admin update error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/hotspots — Geospatial clustering for hotspot detection
router.get('/hotspots', adminAuth, async (req, res) => {
  try {
    // Cluster by rounding coords to 3 decimal places (~110m precision)
    const hotspots = await Complaint.aggregate([
      { $match: { status: { $nin: ['resolved', 'rejected'] } } },
      {
        $group: {
          _id: {
            lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] },
            lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] }
          },
          count: { $sum: 1 },
          avgUrgency: { $avg: '$aiAnalysis.urgency_score' },
          categories: { $push: '$category' },
          complaints: { $push: { _id: '$_id', title: '$title', status: '$status', urgency: '$urgency' } }
        }
      },
      { $match: { count: { $gte: 3 } } },
      { $sort: { avgUrgency: -1 } }
    ]);

    const formatted = hotspots.map(h => ({
      lat: h._id.lat,
      lng: h._id.lng,
      count: h.count,
      avgUrgency: Math.round(h.avgUrgency * 10) / 10,
      riskLevel: h.avgUrgency >= 8 ? 'critical' : h.avgUrgency >= 5 ? 'high' : 'moderate',
      topCategories: [...new Set(h.categories)].slice(0, 3),
      complaints: h.complaints
    }));

    res.json({ hotspots: formatted });
  } catch (error) {
    console.error('Hotspot error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/insights — Predictive insights
router.get('/insights', adminAuth, async (req, res) => {
  try {
    // Top recurring categories this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentByCategory = await Complaint.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgUrgency: { $avg: '$aiAnalysis.urgency_score' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Most active reporting times
    const peakHours = await Complaint.aggregate([
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Top reporters
    const topReporters = await User.find({ role: 'citizen' })
      .sort('-totalPointsEarned')
      .limit(5)
      .select('name level tier totalPointsEarned complaintsSubmitted');

    // Critical unresolved count
    const criticalUnresolved = await Complaint.countDocuments({
      urgency: 'critical',
      status: { $nin: ['resolved', 'rejected'] }
    });

    res.json({
      insights: {
        recentByCategory,
        peakHours,
        topReporters,
        criticalUnresolved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/users — List users by role
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/redemptions — Get all reward redemptions
router.get('/redemptions', adminAuth, async (req, res) => {
  try {
    const Redemption = require('../models/Redemption');
    const redemptions = await Redemption.find().populate('user', 'name email').sort('-createdAt');
    res.json({ redemptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/redemptions/:id — Update reward redemption status
router.put('/redemptions/:id', adminAuth, async (req, res) => {
  try {
    const { status, rewardCode, notes } = req.body;
    const Redemption = require('../models/Redemption');
    
    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) {
      return res.status(404).json({ message: 'Redemption not found.' });
    }

    if (status) redemption.status = status;
    if (rewardCode) redemption.rewardCode = rewardCode;
    if (notes !== undefined) redemption.notes = notes;

    await redemption.save();
    
    const updated = await Redemption.findById(redemption._id).populate('user', 'name email');
    res.json({ redemption: updated, message: 'Redemption updated successfully.' });
  } catch (error) {
    console.error('Redemption update error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/users/:id/award-points — Manually award points to a user
router.post('/users/:id/award-points', adminAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Valid amount is required.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.awardPoints(parseInt(amount));
    await user.save();

    res.json({ 
      message: `Successfully awarded ${amount} points to ${user.name}.`,
      user: {
        _id: user._id,
        points: user.points,
        totalPointsEarned: user.totalPointsEarned,
        level: user.level,
        tier: user.tier
      }
    });
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/users/:id/approve — Approve a government official
router.post('/users/:id/approve', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isApproved = true;
    await user.save();
    
    res.json({ message: `Official account for ${user.name} approved!`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
