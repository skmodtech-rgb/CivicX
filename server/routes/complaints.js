const express = require('express');
const multer = require('multer');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { analyzeComplaint, verifyImage } = require('../services/aiEngine');
const stringSimilarity = require('string-similarity');

const router = express.Router();

// Multer config: store in memory (base64 for hackathon demo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// POST /api/complaints — Submit a new complaint with optional images
router.post('/', auth, upload.array('photos', 5), async (req, res) => {
  try {
    const { title, description, category, location: locationStr, images: imageUrls } = req.body;
    const location = typeof locationStr === 'string' ? JSON.parse(locationStr) : locationStr;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    // Duplicate detection: 500m radius, 48 hours
    if (location?.coordinates?.[0] && location?.coordinates?.[1]) {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const nearbyComplaints = await Complaint.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location.coordinates
            },
            $maxDistance: 500
          }
        },
        createdAt: { $gte: fortyEightHoursAgo },
        status: { $nin: ['resolved', 'rejected'] }
      }).limit(10);

      for (const existing of nearbyComplaints) {
        const similarity = stringSimilarity.compareTwoStrings(
          `${title} ${description}`.toLowerCase(),
          `${existing.title} ${existing.description}`.toLowerCase()
        );
        if (similarity > 0.6) {
          return res.status(409).json({
            message: 'A similar issue has already been reported in this area.',
            duplicateOf: existing._id,
            similarity: Math.round(similarity * 100)
          });
        }
      }
    }

    // AI Analysis
    const aiAnalysis = await analyzeComplaint(title, description);

    // Process uploaded images
    let processedImages = [];
    let imageVerification = {
      required: aiAnalysis.imageRequired || false,
      verified: false,
      results: [],
      overallVerdict: 'pending'
    };

    // Handle file uploads (multipart)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64 = file.buffer.toString('base64');
        const dataUri = `data:${file.mimetype};base64,${base64}`;
        processedImages.push(dataUri);

        // AI Image Verification
        const verification = await verifyImage(base64, file.mimetype);
        imageVerification.results.push({
          imageUrl: dataUri.substring(0, 50) + '...',
          isAIGenerated: verification.isAIGenerated,
          confidenceScore: verification.confidenceScore,
          analysisDetails: verification.details
        });
      }
      imageVerification.verified = true;
    }
    // Handle base64 string images (from camera capture)
    else if (imageUrls && imageUrls.length > 0) {
      const imgs = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      for (const img of imgs) {
        processedImages.push(img);
        // Extract base64 data for verification
        const matches = img.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const verification = await verifyImage(matches[2], matches[1]);
          imageVerification.results.push({
            imageUrl: img.substring(0, 50) + '...',
            isAIGenerated: verification.isAIGenerated,
            confidenceScore: verification.confidenceScore,
            analysisDetails: verification.details
          });
        }
      }
      imageVerification.verified = true;
    }

    // Determine overall verdict
    if (!imageVerification.verified && !aiAnalysis.imageRequired) {
      imageVerification.overallVerdict = 'not_required';
    } else if (imageVerification.results.length > 0) {
      const fakeCount = imageVerification.results.filter(r => r.isAIGenerated).length;
      if (fakeCount === 0) imageVerification.overallVerdict = 'authentic';
      else if (fakeCount < imageVerification.results.length) imageVerification.overallVerdict = 'suspicious';
      else imageVerification.overallVerdict = 'fake';
    }

    // Calculate fraud score
    let fraudScore = 0;
    if (imageVerification.overallVerdict === 'fake') fraudScore += 60;
    else if (imageVerification.overallVerdict === 'suspicious') fraudScore += 30;
    if (aiAnalysis.imageRequired && processedImages.length === 0) fraudScore += 20;
    
    // Department Mapping (User selection prioritized, AI fallback for 'other')
    const deptMap = {
      'garbage': 'Municipal Board',
      'water': 'Municipal Board',
      'sewage': 'Municipal Board',
      'pothole': 'Public Works',
      'streetlight': 'Electricity Board',
      'electricity': 'Electricity Board',
      'traffic': 'Traffic Police',
      'police': 'Police Department',
      'fire': 'Fire Department',
      'other': 'Other'
    };

    // If user chose 'other', try to use AI category. If AI also says 'other', stay in 'Other'.
    let finalCategory = category || 'other';
    if (finalCategory === 'other' && aiAnalysis.category && aiAnalysis.category !== 'other') {
      finalCategory = aiAnalysis.category;
    }

    const department = deptMap[finalCategory] || 'Other';

    const complaint = new Complaint({
      user: req.user._id,
      title,
      description,
      category: finalCategory,
      urgency: aiAnalysis.priority || 'medium',
      location: location || { type: 'Point', coordinates: [0, 0] },
      images: processedImages,
      imageVerification,
      aiAnalysis,
      department,
      fraudScore: Math.min(fraudScore, 100)
    });

    await complaint.save();

    // Award points: 50 for submission + 20 if images, penalize if fake
    const user = await User.findById(req.user._id);
    let totalAwarded = 50;
    user.awardPoints(50);
    user.complaintsSubmitted += 1;

    if (processedImages.length > 0 && imageVerification.overallVerdict !== 'fake') {
      user.awardPoints(20);
      totalAwarded += 20;
    }

    // Badge: "First Report"
    if (user.complaintsSubmitted === 1 && !user.badges.find(b => b.name === 'First Report')) {
      user.badges.push({ name: 'First Report', icon: '🎯' });
      user.awardPoints(75);
      totalAwarded += 75;
    }

    await user.save();

    const populated = await Complaint.findById(complaint._id).populate('user', 'name email avatar level tier');

    res.status(201).json({
      complaint: populated,
      pointsAwarded: totalAwarded,
      user: {
        points: user.points,
        level: user.level,
        tier: user.tier,
        totalPointsEarned: user.totalPointsEarned,
        complaintsSubmitted: user.complaintsSubmitted
      },
      imageVerification: {
        verdict: imageVerification.overallVerdict,
        imageRequired: aiAnalysis.imageRequired,
        results: imageVerification.results
      }
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ message: 'Server error submitting complaint.' });
  }
});


// GET /api/complaints — List all complaints
router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email avatar level tier')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error fetching complaints.' });
  }
});

// GET /api/complaints/:id — Single complaint detail
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email avatar level tier')
      .populate('upvotes', 'name')
      .populate('downvotes', 'name');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/complaints/:id/vote — Upvote/Downvote
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const userId = req.user._id;

    if (type === 'up') {
      // Remove from downvotes if present
      complaint.downvotes = complaint.downvotes.filter(id => !id.equals(userId));

      if (complaint.upvotes.some(id => id.equals(userId))) {
        complaint.upvotes = complaint.upvotes.filter(id => !id.equals(userId));
      } else {
        complaint.upvotes.push(userId);
        // Award voter points
        const voter = await User.findById(userId);
        voter.awardPoints(15);
        await voter.save();
      }
    } else if (type === 'down') {
      complaint.upvotes = complaint.upvotes.filter(id => !id.equals(userId));

      if (complaint.downvotes.some(id => id.equals(userId))) {
        complaint.downvotes = complaint.downvotes.filter(id => !id.equals(userId));
      } else {
        complaint.downvotes.push(userId);
      }
    }

    await complaint.save();
    res.json({
      upvotes: complaint.upvotes.length,
      downvotes: complaint.downvotes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/complaints/user/mine — User's own complaints
router.get('/user/mine', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('user', 'name email avatar level tier');

    res.json({ complaints });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/complaints/:id/notify — Mark as notified (Official/Admin only)
router.patch('/:id/notify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'official') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.notifiedAuthority = true;
    await complaint.save();
    res.json({ success: true, notifiedAuthority: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
