const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Available vouchers
const VOUCHERS = [
  { id: 'amazon_100', name: 'Amazon ₹100 Gift Card', cost: 500, icon: '🛒', brand: 'Amazon' },
  { id: 'amazon_250', name: 'Amazon ₹250 Gift Card', cost: 1200, icon: '🛒', brand: 'Amazon' },
  { id: 'gplay_100', name: 'Google Play ₹100', cost: 500, icon: '🎮', brand: 'Google Play' },
  { id: 'gplay_250', name: 'Google Play ₹250', cost: 1200, icon: '🎮', brand: 'Google Play' },
  { id: 'flipkart_100', name: 'Flipkart ₹100 Gift Card', cost: 500, icon: '🛍️', brand: 'Flipkart' },
  { id: 'flipkart_500', name: 'Flipkart ₹500 Gift Card', cost: 2500, icon: '🛍️', brand: 'Flipkart' },
  { id: 'coffee_free', name: 'Free Coffee Voucher', cost: 200, icon: '☕', brand: 'Café CivicX' },
  { id: 'metro_pass', name: 'Metro Day Pass', cost: 300, icon: '🚇', brand: 'City Metro' }
];

// GET /api/rewards/vouchers — List available vouchers
router.get('/vouchers', auth, (req, res) => {
  res.json({ vouchers: VOUCHERS, userPoints: req.user.points });
});

const Redemption = require('../models/Redemption');

// POST /api/rewards/redeem — Redeem a voucher
router.post('/redeem', auth, async (req, res) => {
  try {
    const { voucherId } = req.body;
    const voucher = VOUCHERS.find(v => v.id === voucherId);

    if (!voucher) {
      return res.status(400).json({ message: 'Invalid voucher.' });
    }

    const user = await User.findById(req.user._id);

    if (user.points < voucher.cost) {
      return res.status(400).json({
        message: `Insufficient points. You need ${voucher.cost - user.points} more points.`
      });
    }

    user.points -= voucher.cost;
    // We still push to user history for backward compatibility if needed, but primarily rely on Redemption model
    user.redeemedVouchers.push({
      voucherName: voucher.name,
      pointsCost: voucher.cost
    });

    await user.save();

    // Create the actual redemption request for the admin
    const redemption = new Redemption({
      user: user._id,
      voucherName: voucher.name,
      pointsCost: voucher.cost,
      status: 'pending'
    });
    await redemption.save();

    res.json({
      message: `Successfully claimed: ${voucher.name}! It is now pending admin approval.`,
      remainingPoints: user.points,
      voucher,
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/rewards/redemptions — Get current user's redemption history
router.get('/redemptions', auth, async (req, res) => {
  try {
    const redemptions = await Redemption.find({ user: req.user._id }).sort('-createdAt');
    res.json({ redemptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/rewards/leaderboard — Top citizens
router.get('/leaderboard', async (req, res) => {
  try {
    const leaders = await User.find({ role: 'citizen' })
      .sort('-totalPointsEarned')
      .limit(20)
      .select('name level tier totalPointsEarned complaintsSubmitted badges avatar');

    res.json({ leaderboard: leaders });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/rewards/profile — Current user's rewards profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const nextLevelPoints = user.level * 500;
    const progressToNextLevel = ((user.totalPointsEarned % 500) / 500) * 100;

    res.json({
      profile: {
        ...user.toObject(),
        nextLevelPoints,
        progressToNextLevel: Math.round(progressToNextLevel),
        pointsToNextLevel: nextLevelPoints - user.totalPointsEarned
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
