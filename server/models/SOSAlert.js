const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userPhone: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  status: { 
    type: String, 
    enum: ['active', 'responding', 'resolved'], 
    default: 'active' 
  },
  notifiedContacts: [{
    name: String,
    phone: String
  }],
  priority: { type: String, default: 'HIGH' }
}, { timestamps: true });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
