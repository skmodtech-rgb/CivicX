const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['citizen', 'official', 'admin'], default: 'citizen' },
  department: { type: String }, // For officials: 'Waste', 'Roads', 'Electricity', etc.
  avatar: { type: String, default: '' },

  // Gamification
  reputationScore: { type: Number, default: 50, min: 0, max: 100 },
  points: { type: Number, default: 0 },
  totalPointsEarned: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  badges: [{
    name: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],

  // Stats
  complaintsSubmitted: { type: Number, default: 0 },
  complaintsResolved: { type: Number, default: 0 },

  // Voucher redemption history
  redeemedVouchers: [{
    voucherName: String,
    pointsCost: Number,
    redeemedAt: { type: Date, default: Date.now }
  }],

  // Emergency Features
  emergencyContacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String }
  }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate level and tier from totalPointsEarned
userSchema.methods.recalculateLevel = function() {
  const newLevel = Math.floor(this.totalPointsEarned / 500) + 1;
  const leveledUp = newLevel > this.level;
  this.level = newLevel;

  // Tier calculation
  if (this.totalPointsEarned >= 5000) this.tier = 'platinum';
  else if (this.totalPointsEarned >= 2500) this.tier = 'gold';
  else if (this.totalPointsEarned >= 1000) this.tier = 'silver';
  else this.tier = 'bronze';

  return leveledUp;
};

// Award points
userSchema.methods.awardPoints = function(amount) {
  this.points += amount;
  this.totalPointsEarned += amount;
  const leveledUp = this.recalculateLevel();

  // Level-up bonus
  if (leveledUp) {
    this.points += 200;
    this.totalPointsEarned += 200;
    this.recalculateLevel();
  }

  return leveledUp;
};

module.exports = mongoose.model('User', userSchema);
