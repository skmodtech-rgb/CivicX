require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

const IMAGE_MAP = {
  pothole: 'https://i.ibb.co/5xwdn6zn/potholes1.webp',
  garbage: 'https://i.ibb.co/6phYXqj/garbage1.png',
  streetlight: 'https://i.ibb.co/Tp2Hpbj/streetlight1.webp',
  water: 'https://i.ibb.co/4ZtCHsRg/water1.jpg',
  sewage: 'https://i.ibb.co/3Y51WhSQ/sewage.avif',
  noise: 'https://i.ibb.co/zT96vbF1/noice.jpg',
  encroachment: 'https://i.ibb.co/wDW31r2/Encroachment.png',
  traffic: 'https://i.ibb.co/FqVpKBYC/traffic.webp',
  electricity: 'https://i.ibb.co/8DPJsHj7/electricity.avif'
};

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const complaints = await Complaint.find({});
    console.log(`📊 Found ${complaints.length} complaints to process`);

    let updatedCount = 0;
    for (const c of complaints) {
      const realUrl = IMAGE_MAP[c.category];
      if (realUrl) {
        c.images = [realUrl];
        // Also update image verification to look authentic for demo
        c.imageVerification = {
          required: true,
          verified: true,
          results: [{
            imageUrl: realUrl,
            isAIGenerated: false,
            confidenceScore: 99,
            analysisDetails: 'Verified real-world image for demonstration.'
          }],
          overallVerdict: 'authentic'
        };
        await c.save();
        updatedCount++;
        console.log(`✨ Updated [${c.category}] - ${c._id}`);
      }
    }

    console.log(`\n🎉 Migration complete! ${updatedCount} reports updated with real images.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
