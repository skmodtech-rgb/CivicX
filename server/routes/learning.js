const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const LearningProgress = require('../models/LearningProgress');
const User = require('../models/User');

const LEARNING_MODULES = [
  {
    id: 'waste-segregation',
    title: 'Waste Segregation Basics',
    type: 'video',
    thumbnail: '/categories/cat_garbage.png',
    description: 'Learn the importance of segregating dry and wet waste at the source.',
    videoUrl: 'https://www.youtube.com/embed/utTOMe8FkqU',
    duration: '3 mins',
    rewardPoints: 10,
    quiz: [
      { question: 'Which bin is used for wet waste?', options: ['Green', 'Blue', 'Red', 'Yellow'], answer: 'Green' },
      { question: 'What is considered dry waste?', options: ['Vegetable peels', 'Plastic bottles', 'Leftover food', 'Leaves'], answer: 'Plastic bottles' },
      { question: 'Why is segregation important?', options: ['To make bins heavy', 'To help recycling', 'To feed animals', 'No reason'], answer: 'To help recycling' }
    ]
  },
  {
    id: 'road-safety',
    title: 'Road Safety Rules',
    type: 'video',
    thumbnail: '/categories/cat_traffic.png',
    description: 'Understand basic traffic signals and pedestrian safety rules.',
    videoUrl: 'https://www.youtube.com/embed/BVjUabjx-00',
    duration: '4 mins',
    rewardPoints: 10,
    quiz: [
      { question: 'What does a red traffic light mean?', options: ['Go', 'Stop', 'Yield', 'Speed up'], answer: 'Stop' },
      { question: 'Where should pedestrians cross the road?', options: ['Anywhere', 'Zebra crossing', 'Near signals only', 'Behind buses'], answer: 'Zebra crossing' },
      { question: 'Is wearing a helmet mandatory for two-wheelers?', options: ['Yes', 'No', 'Only at night', 'Only on highways'], answer: 'Yes' }
    ]
  },
  {
    id: 'water-conservation',
    title: 'Water Conservation at Home',
    type: 'article',
    thumbnail: '/categories/cat_water.png',
    description: 'Simple habits to save gallons of water every day.',
    content: "Water is a precious resource. Simple habits like turning off the tap while brushing, fixing leaks promptly, and using buckets instead of hoses for washing vehicles can save thousands of liters annually. Rainwater harvesting is another critical method for replenishing groundwater levels.",
    duration: '2 min read',
    rewardPoints: 5,
    quiz: [
      { question: 'Which method saves the most water when washing a car?', options: ['Using a hose', 'Using a bucket', 'Leaving it in rain', 'Using a sprinkler'], answer: 'Using a bucket' },
      { question: 'Should you leave the tap running while brushing?', options: ['Yes', 'No', 'Sometimes', 'Only morning'], answer: 'No' },
      { question: 'What is Rainwater Harvesting?', options: ['Collecting rainwater for use', 'Making rain', 'Dancing in rain', 'Boiling rain'], answer: 'Collecting rainwater for use' }
    ]
  },
  {
    id: 'public-property',
    title: 'Respecting Public Property',
    type: 'article',
    thumbnail: '/categories/cat_streetlight.png',
    description: 'Understanding our responsibility towards public amenities.',
    content: "Public property belongs to all citizens. Vandalism, defacing walls, and damaging public transport affect everyone. It is our civic duty to protect and maintain these facilities as if they were our own. Reporting damage is a responsible citizen's duty.",
    duration: '3 min read',
    rewardPoints: 5,
    quiz: [
      { question: 'Who pays for repairing public property?', options: ['Aliens', 'Taxpayers', 'No one', 'Magic'], answer: 'Taxpayers' },
      { question: 'What should you do if you see someone vandalizing?', options: ['Join them', 'Ignore', 'Report to authorities', 'Take photos for fun'], answer: 'Report to authorities' },
      { question: 'Are public buses our property?', options: ['Yes, collectively', 'No, government only', 'Only the drivers', 'Nobody\'s'], answer: 'Yes, collectively' }
    ]
  },
  {
    id: 'cyber-fraud',
    title: 'Cyber Fraud Awareness',
    type: 'video',
    thumbnail: '/categories/cat_electrical.png',
    description: 'Learn how to identify and avoid common online scams.',
    videoUrl: 'https://www.youtube.com/embed/fj0KKldDfDM',
    duration: '5 mins',
    rewardPoints: 10,
    quiz: [
      { question: 'Should you share OTP with callers?', options: ['Yes, always', 'No, never', 'Only to banks', 'Only to police'], answer: 'No, never' },
      { question: 'What indicates a secure website?', options: ['http://', 'https://', 'www.', '.com'], answer: 'https://' },
      { question: 'If you win a lottery you didn\'t enter, it is likely a...', options: ['Scam', 'Miracle', 'Mistake', 'Bank error'], answer: 'Scam' }
    ]
  },
  {
    id: 'public-cleanliness',
    title: 'Public Cleanliness',
    type: 'video',
    thumbnail: '/categories/cat_sewage.png',
    description: 'The impact of littering and how to maintain clean public spaces.',
    videoUrl: 'https://www.youtube.com/embed/_xHQldYsdBY',
    duration: '4 mins',
    rewardPoints: 10,
    quiz: [
      { question: 'What is the main cause of choked drains?', options: ['Rain', 'Plastic litter', 'Animals', 'Leaves'], answer: 'Plastic litter' },
      { question: 'Where should you throw wrappers while traveling?', options: ['Out the window', 'On the floor', 'Keep until you find a bin', 'Under the seat'], answer: 'Keep until you find a bin' },
      { question: 'Who is responsible for clean streets?', options: ['Sweepers only', 'Government only', 'Every citizen', 'Nobody'], answer: 'Every citizen' }
    ]
  },
  {
    id: 'traffic-discipline',
    title: 'Traffic Discipline',
    type: 'article',
    thumbnail: '/categories/cat_encroachment.png',
    description: 'Why lane driving and avoiding honking is crucial.',
    content: "Traffic discipline reduces accidents and commute times. Staying in your lane, avoiding unnecessary honking, and respecting speed limits are signs of a developed civic sense. Honking causes severe noise pollution and increases stress for everyone on the road.",
    duration: '2 min read',
    rewardPoints: 5,
    quiz: [
      { question: 'Why should you avoid unnecessary honking?', options: ['Saves battery', 'Reduces noise pollution', 'It is illegal', 'Scares animals'], answer: 'Reduces noise pollution' },
      { question: 'What is lane driving?', options: ['Driving in zigzag', 'Staying in one marked lane', 'Driving on the wrong side', 'Driving on footpath'], answer: 'Staying in one marked lane' },
      { question: 'Speed limits are set for...', options: ['Safety', 'Slowing you down', 'Saving fuel', 'No reason'], answer: 'Safety' }
    ]
  },
  {
    id: 'women-safety',
    title: 'Women Safety Awareness',
    type: 'video',
    thumbnail: '/categories/cat_other.png',
    description: 'Basic self-defense awareness and emergency tools.',
    videoUrl: 'https://www.youtube.com/embed/M4_8PoRKiNU',
    duration: '6 mins',
    rewardPoints: 10,
    quiz: [
      { question: 'What is the national emergency number in many regions for women safety?', options: ['100 or 112', '911', '108', '123'], answer: '100 or 112' },
      { question: 'What should you do if you feel followed?', options: ['Go to a dark alley', 'Go to a well-lit public space', 'Run blindly', 'Ignore it'], answer: 'Go to a well-lit public space' },
      { question: 'Are SOS apps helpful?', options: ['Yes, highly', 'No', 'Only for fun', 'Sometimes'], answer: 'Yes, highly' }
    ]
  },
  {
    id: 'emergency-response',
    title: 'Emergency Response Basics',
    type: 'article',
    thumbnail: '/categories/cat_noise.png',
    description: 'What to do during a medical or fire emergency.',
    content: "During an emergency, staying calm is your greatest asset. For fires, use the stairs, never the elevator, and call the fire department immediately. For medical emergencies, check for breathing and pulse, and call an ambulance. Knowing basic CPR can save lives before help arrives.",
    duration: '3 min read',
    rewardPoints: 5,
    quiz: [
      { question: 'Should you use an elevator during a fire?', options: ['Yes', 'No', 'Only if fast', 'Only going down'], answer: 'No' },
      { question: 'What is the first thing to do in an emergency?', options: ['Panic', 'Run away', 'Stay calm', 'Take a video'], answer: 'Stay calm' },
      { question: 'What can save a life during cardiac arrest before ambulance arrives?', options: ['Giving water', 'Basic CPR', 'Slapping them', 'Nothing'], answer: 'Basic CPR' }
    ]
  },
  {
    id: 'responsible-citizen',
    title: 'Responsible Citizen Habits',
    type: 'article',
    thumbnail: '/categories/cat_pothole.png',
    description: 'Small daily habits that build a great community.',
    content: "A responsible citizen participates in the community. This means voting, paying taxes honestly, reporting civic issues (like potholes or broken lights), helping neighbors, and respecting all professions. Change starts with one person's daily habits.",
    duration: '3 min read',
    rewardPoints: 5,
    quiz: [
      { question: 'Is voting a right or a duty?', options: ['Only a right', 'Both a right and a duty', 'Optional', 'Waste of time'], answer: 'Both a right and a duty' },
      { question: 'What should you do if you see a broken streetlight?', options: ['Ignore it', 'Break it more', 'Report it on CivicX', 'Steal the bulb'], answer: 'Report it on CivicX' },
      { question: 'Does a single person\'s habit matter?', options: ['No', 'Yes, it inspires others', 'Only if they are famous', 'Maybe'], answer: 'Yes, it inspires others' }
    ]
  }
];

// GET /api/learning/modules
router.get('/modules', auth, async (req, res) => {
  try {
    let progress = await LearningProgress.findOne({ user: req.user._id });
    if (!progress) {
      progress = new LearningProgress({ user: req.user._id });
      await progress.save();
    }
    
    const modulesWithProgress = LEARNING_MODULES.map(mod => {
      const isCompleted = progress.completedLessons.includes(mod.id);
      const quizResult = progress.completedQuizzes.find(q => q.topicId === mod.id);
      return {
        ...mod,
        quiz: mod.quiz.map(q => ({ question: q.question, options: q.options })), 
        isCompleted,
        quizPassed: !!quizResult
      };
    });

    res.json({
      modules: modulesWithProgress,
      progress: {
        completedLessons: progress.completedLessons,
        completedQuizzes: progress.completedQuizzes,
        totalLearningPoints: progress.totalLearningPoints
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching learning data' });
  }
});

// POST /api/learning/complete/:id
router.post('/complete/:id', auth, async (req, res) => {
  try {
    const mod = LEARNING_MODULES.find(m => m.id === req.params.id);
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    let progress = await LearningProgress.findOne({ user: req.user._id });
    if (!progress) {
      progress = new LearningProgress({ user: req.user._id });
    }

    if (progress.completedLessons.includes(mod.id)) {
      return res.status(400).json({ error: 'Lesson already completed' });
    }

    progress.completedLessons.push(mod.id);
    progress.totalLearningPoints += mod.rewardPoints;
    await progress.save();

    const user = await User.findById(req.user._id);
    user.awardPoints(mod.rewardPoints);
    await user.save();

    res.json({ 
      success: true, 
      rewardPoints: mod.rewardPoints, 
      totalLearningPoints: progress.totalLearningPoints,
      user: {
        points: user.points,
        level: user.level,
        tier: user.tier,
        totalPointsEarned: user.totalPointsEarned
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error completing lesson' });
  }
});

// POST /api/learning/quiz/:id
router.post('/quiz/:id', auth, async (req, res) => {
  try {
    const mod = LEARNING_MODULES.find(m => m.id === req.params.id);
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    const { answers } = req.body;
    let correct = 0;
    
    mod.quiz.forEach((q, idx) => {
      if (answers[idx] === q.answer) correct++;
    });

    const score = Math.round((correct / mod.quiz.length) * 100);
    const passed = score >= 60;

    let progress = await LearningProgress.findOne({ user: req.user._id });
    const alreadyPassed = progress.completedQuizzes.find(q => q.topicId === mod.id);

    if (passed && !alreadyPassed) {
      const quizReward = 15;
      progress.completedQuizzes.push({ topicId: mod.id, score, passedAt: new Date() });
      progress.totalLearningPoints += quizReward;
      await progress.save();

      const user = await User.findById(req.user._id);
      user.awardPoints(quizReward);
      await user.save();

      return res.json({ 
        passed: true, 
        score, 
        rewardPoints: quizReward, 
        message: 'Quiz passed! Points awarded.',
        user: {
          points: user.points,
          level: user.level,
          tier: user.tier,
          totalPointsEarned: user.totalPointsEarned
        }
      });
    }

    if (alreadyPassed) {
      return res.json({ passed: true, score, rewardPoints: 0, message: 'You already passed this quiz previously.' });
    }

    res.json({ passed: false, score, rewardPoints: 0, message: 'Score too low. Try again!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error submitting quiz' });
  }
});

module.exports = router;
