const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedLessons: [{ type: String }],
  completedQuizzes: [{
    topicId: String,
    score: Number,
    passedAt: { type: Date, default: Date.now }
  }],
  totalLearningPoints: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
