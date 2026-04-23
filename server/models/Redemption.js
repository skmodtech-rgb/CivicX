const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voucherName: { type: String, required: true },
  pointsCost: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'delivered'], default: 'pending' },
  rewardCode: { type: String, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Redemption', redemptionSchema);
