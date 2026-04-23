const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['garbage', 'pothole', 'streetlight', 'water', 'sewage', 'noise', 'encroachment', 'traffic', 'electrical', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate'],
    default: 'pending'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    address: { type: String, default: '' }
  },
  images: [{ type: String }],

  // Image Verification
  imageVerification: {
    required: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    results: [{
      imageUrl: String,
      isAIGenerated: { type: Boolean, default: false },
      confidenceScore: { type: Number, default: 0 },
      analysisDetails: String
    }],
    overallVerdict: { type: String, enum: ['authentic', 'suspicious', 'fake', 'pending', 'not_required'], default: 'pending' }
  },

  // AI Analysis
  aiAnalysis: {
    category: String,
    priority: String,
    sentiment: String,
    keywords: [String],
    summary: String,
    confidence: { type: Number, default: 0 },
    urgency_score: { type: Number, default: 5 },
    suggested_resolution: String,
    source: { type: String, default: 'gemini' }
  },

  // Fraud & Moderation
  fraudScore: { type: Number, default: 0, min: 0, max: 100 },
  isDuplicate: { type: Boolean, default: false },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },

  // Community Voting
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Admin & Department assignment
  department: { 
    type: String, 
    enum: ['Waste Management', 'Public Works', 'Electricity Board', 'Water & Sewage', 'Traffic Police', 'Police / Environment', 'Health & Safety', 'Other'],
    default: 'Other'
  },
  assignedOfficial: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNotes: { type: String, default: '' },
  
  // Official Resolution Proof
  officialResolution: {
    description: String,
    imageUrl: String,
    submittedAt: Date,
    verifiedByAdmin: { type: Boolean, default: false }
  },
  
  resolvedAt: { type: Date },
  notifiedAuthority: { type: Boolean, default: false }
}, { timestamps: true });

// 2dsphere index for geospatial queries
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
