const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// Middleware to ensure user is an official
const isOfficial = (req, res, next) => {
  if (req.user.role !== 'official' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Official only.' });
  }
  next();
};

// @route   GET /api/official/tasks
// @desc    Get all complaints assigned to the official's department
router.get('/tasks', auth, isOfficial, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const department = user.department;

    if (!department) {
      return res.status(400).json({ message: 'Official has no department assigned.' });
    }

    const tasks = await Complaint.find({ 
      department,
      status: { $in: ['pending', 'assigned', 'in_progress'] }
    }).sort({ createdAt: -1 }).populate('user', 'name email level tier');

    res.json({ tasks, department });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/official/resolve/:id
// @desc    Submit resolution with proof
router.post('/resolve/:id', auth, isOfficial, async (req, res) => {
  try {
    const { description, proofImage } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: 'Task not found' });
    
    // In a real app, check if it's the right department
    // if (complaint.department !== req.user.department) ...

    if (!proofImage) {
      return res.status(400).json({ message: 'Photo proof is required for resolution.' });
    }

    complaint.status = 'resolved';
    complaint.officialResolution = {
      description,
      imageUrl: proofImage,
      submittedAt: new Date(),
      verifiedByAdmin: false // Could be auto-verified for now
    };
    complaint.resolvedAt = new Date();
    complaint.assignedOfficial = req.user._id;

    await complaint.save();

    // Award points to the citizen who reported it
    const citizen = await User.findById(complaint.user);
    if (citizen) {
      citizen.awardPoints(100); // Bonus for resolution
      citizen.complaintsResolved += 1;
      await citizen.save();
    }

    res.json({ message: 'Task resolved successfully!', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
