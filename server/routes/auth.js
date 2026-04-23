const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = new User({ 
      name, 
      email: email.toLowerCase(), 
      password,
      role: role || 'citizen',
      department: department || null,
      isApproved: role === 'official' ? false : true
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        points: user.points,
        totalPointsEarned: user.totalPointsEarned,
        level: user.level,
        tier: user.tier,
        reputationScore: user.reputationScore,
        badges: user.badges,
        complaintsSubmitted: user.complaintsSubmitted,
        complaintsResolved: user.complaintsResolved
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    if (user.role === 'official' && !user.isApproved) {
      return res.status(403).json({ message: 'Your official account is pending administrator approval.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        points: user.points,
        totalPointsEarned: user.totalPointsEarned,
        level: user.level,
        tier: user.tier,
        reputationScore: user.reputationScore,
        badges: user.badges,
        complaintsSubmitted: user.complaintsSubmitted,
        complaintsResolved: user.complaintsResolved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ message: 'Profile updated!', user: { ...user.toObject(), password: Array(user.password.length).fill('*').join('') } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
