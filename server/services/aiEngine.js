const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * CivicBrain v2.5 — AI Engine powered by Gemini 2.5 Flash
 * Handles complaint classification, urgency scoring, and resolution hints.
 */
async function analyzeComplaint(title, description) {
  try {
    // Dynamic initialization per request for fresh API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are CivicBrain v2.5, an expert AI system for municipal issue analysis.
Analyze the following civic complaint and return ONLY a valid JSON object with NO additional text, markdown, or code blocks.

Title: "${title}"
Description: "${description}"

Return this exact JSON structure:
{
  "category": "<one of: garbage, pothole, streetlight, water, sewage, noise, encroachment, traffic, electrical, other>",
  "priority": "<one of: low, medium, high, critical>",
  "sentiment": "<one of: frustrated, concerned, neutral, angry, emergency>",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "summary": "<Professional 1-sentence summary of the issue>",
  "confidence": <decimal 0.0 to 1.0>,
  "urgency_score": <integer 1 to 10 based on public safety risk>,
  "suggested_resolution": "<Actionable technical suggestion for city workers to resolve this>"
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Robust JSON extraction using regex
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI: No JSON found in response:', rawText);
      return getFallbackAnalysis(title, description);
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate required fields
    const validCategories = ['garbage', 'pothole', 'streetlight', 'water', 'sewage', 'noise', 'encroachment', 'traffic', 'electrical', 'other'];
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    if (!validCategories.includes(analysis.category)) analysis.category = 'other';
    if (!validPriorities.includes(analysis.priority)) analysis.priority = 'medium';
    if (typeof analysis.confidence !== 'number') analysis.confidence = 0.7;
    if (typeof analysis.urgency_score !== 'number') analysis.urgency_score = 5;

    analysis.source = 'gemini';
    return analysis;
  } catch (error) {
    console.error('AI Engine Error:', error.message);
    return getFallbackAnalysis(title, description);
  }
}

/**
 * Keyword-based fallback when Gemini is unavailable
 */
function getFallbackAnalysis(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  const categoryMap = {
    garbage: ['garbage', 'waste', 'trash', 'dump', 'litter', 'rubbish', 'dirty'],
    pothole: ['pothole', 'road', 'crack', 'bump', 'broken road', 'asphalt'],
    streetlight: ['light', 'lamp', 'dark', 'streetlight', 'bulb', 'illumination'],
    water: ['water', 'leak', 'pipe', 'flood', 'supply', 'tap', 'drain'],
    sewage: ['sewage', 'sewer', 'drain', 'smell', 'gutter', 'clog'],
    noise: ['noise', 'loud', 'construction', 'disturbance', 'horn'],
    encroachment: ['encroachment', 'illegal', 'building', 'footpath', 'hawker'],
    traffic: ['traffic', 'signal', 'congestion', 'parking', 'jam'],
    electrical: ['electric', 'wire', 'shock', 'voltage', 'transformer', 'power']
  };

  let detectedCategory = 'other';
  let maxScore = 0;

  for (const [category, keywords] of Object.entries(categoryMap)) {
    const score = keywords.filter(k => text.includes(k)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }

  const urgencyKeywords = ['danger', 'emergency', 'accident', 'fire', 'electrocution', 'collapse', 'flood', 'critical'];
  const urgencyHits = urgencyKeywords.filter(k => text.includes(k)).length;
  const urgencyScore = Math.min(3 + urgencyHits * 3, 10);

  return {
    category: detectedCategory,
    priority: urgencyScore >= 8 ? 'critical' : urgencyScore >= 5 ? 'high' : 'medium',
    sentiment: 'concerned',
    keywords: text.split(/\s+/).slice(0, 6),
    summary: `Civic issue reported: ${title}`,
    confidence: 0.55,
    urgency_score: urgencyScore,
    suggested_resolution: 'Manual inspection recommended. AI fallback mode active — verify on-site.',
    source: 'fallback'
  };
}

module.exports = { analyzeComplaint };
