const express = require('express');
const router = express.Router();
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const User = require('../models/User');
const SOSAlert = require('../models/SOSAlert');

// ─── Emergency Contacts ──────────────────────────────────

// @route   GET /api/sos/contacts
// @desc    Get user's personal emergency contacts
router.get('/contacts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyContacts');
    res.json(user.emergencyContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/sos/contacts
// @desc    Add a personal emergency contact
router.post('/contacts', protect, async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const user = await User.findById(req.user._id);
    
    // Check duplicates
    const exists = user.emergencyContacts.some(c => c.phone === phone);
    if (exists) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    user.emergencyContacts.push({ name, phone, relationship });
    await user.save();
    res.status(201).json(user.emergencyContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/sos/contacts/:id
// @desc    Delete a personal emergency contact
router.delete('/contacts/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.emergencyContacts = user.emergencyContacts.filter(c => c._id.toString() !== req.params.id);
    await user.save();
    res.json(user.emergencyContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── SOS Alerts ──────────────────────────────────────────

// @route   POST /api/sos/trigger
// @desc    Trigger an SOS alert
router.post('/trigger', protect, async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ message: 'GPS coordinates are required for SOS' });
    }

    const user = await User.findById(req.user._id).select('name email emergencyContacts');
    
    // Prevent spam: Check for active SOS from same user in last 2 minutes
    const recentSOS = await SOSAlert.findOne({
      userId: user._id,
      status: 'active',
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) }
    });

    if (recentSOS) {
      return res.status(429).json({ message: 'An active SOS is already in progress. Please wait.' });
    }

    const alert = new SOSAlert({
      userId: user._id,
      userName: user.name,
      location: { lat, lng, address },
      notifiedContacts: user.emergencyContacts.map(c => ({ name: c.name, phone: c.phone }))
    });

    await alert.save();

    // In a real app, this would trigger SMS/Push via n8n or Twilio
    console.log(`🚨 SOS TRIGGERED by ${user.name} at ${lat}, ${lng}`);
    console.log(`📢 Notifying ${user.emergencyContacts.length} contacts...`);

    res.status(201).json({
      message: 'SOS Alert Broadcasted!',
      alertId: alert._id,
      notifiedCount: user.emergencyContacts.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/sos/active
// @desc    Get all active/responding SOS alerts (Admin only)
router.get('/active', protect, admin, async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ status: { $ne: 'resolved' } })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/sos/:id/status
// @desc    Update SOS status (Admin only)
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await SOSAlert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
