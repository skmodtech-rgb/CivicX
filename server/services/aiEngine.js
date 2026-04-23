const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * CivicBrain v3.1 — AI Engine powered by Gemini (with resilience)
 * Features: retry with exponential backoff, model fallback chain,
 * complaint classification, image requirement logic, and AI image detection.
 */

// ─── Model Fallback Chain ────────────────────────────────
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash'];

// ─── Retry with Exponential Backoff ──────────────────────
async function callGeminiWithRetry(genAI, modelContent, { maxRetries = 3, baseDelay = 1000 } = {}) {
  let lastError;

  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(modelContent);
        return { result, modelUsed: modelName };
      } catch (error) {
        lastError = error;
        const status = error?.status || error?.response?.status || 0;
        const isRetryable = [429, 500, 503].includes(status) ||
          error.message?.includes('503') ||
          error.message?.includes('429') ||
          error.message?.includes('overloaded') ||
          error.message?.includes('high demand');

        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
          console.warn(`⚠️ Gemini ${modelName} attempt ${attempt}/${maxRetries} failed (${status || 'retryable'}). Retrying in ${Math.round(delay)}ms...`);
          await new Promise(r => setTimeout(r, delay));
        } else if (!isRetryable) {
          // Non-retryable error, skip remaining retries for this model
          console.error(`❌ Gemini ${modelName} non-retryable error:`, error.message);
          break;
        }
      }
    }
    console.warn(`⚠️ Model ${modelName} exhausted all retries. Trying next model...`);
  }

  throw lastError || new Error('All Gemini models unavailable');
}

// ─── Constants ───────────────────────────────────────────
const IMAGE_OPTIONAL_CATEGORIES = ['noise', 'other'];
const SENSITIVE_KEYWORDS = ['women safety', 'harassment', 'stalking', 'threat', 'abuse',
  'domestic violence', 'eve teasing', 'molest', 'assault', 'unsafe'];

/**
 * Determine if image upload should be mandatory based on category + content
 */
function shouldRequireImage(category, title, description, urgencyScore) {
  const text = `${title} ${description}`.toLowerCase();

  // Sensitive complaints: image is NEVER mandatory
  if (SENSITIVE_KEYWORDS.some(k => text.includes(k))) return false;

  // General/noise complaints: optional
  if (IMAGE_OPTIONAL_CATEGORIES.includes(category)) return false;

  // High urgency: mandatory
  if (urgencyScore >= 7) return true;

  // Infrastructure categories: mandatory
  const mandatoryCategories = ['pothole', 'streetlight', 'water', 'sewage', 'garbage', 'encroachment', 'electrical'];
  return mandatoryCategories.includes(category);
}

/**
 * Core complaint analysis via Gemini (with retry + fallback)
 */
async function analyzeComplaint(title, description) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `You are CivicBrain v3.0, an expert AI system for municipal issue analysis.
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
  "suggested_resolution": "<Actionable technical suggestion for city workers to resolve this>",
  "is_sensitive": <boolean - true if complaint involves personal safety, harassment, women safety, or similar sensitive topics>
}`;

    const { result, modelUsed } = await callGeminiWithRetry(genAI, prompt);
    const rawText = result.response.text();

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

    // Compute image requirement
    analysis.imageRequired = shouldRequireImage(
      analysis.category, title, description, analysis.urgency_score
    );

    analysis.source = 'gemini';
    analysis.model = modelUsed;
    console.log(`✅ AI Analysis completed via ${modelUsed}`);
    return analysis;
  } catch (error) {
    console.error('AI Engine Error (all retries exhausted):', error.message);
    return getFallbackAnalysis(title, description);
  }
}

/**
 * Verify if an uploaded image is AI-generated or authentic
 * Uses Gemini's multimodal vision capabilities (with retry + fallback)
 */
async function verifyImage(base64ImageData, mimeType = 'image/jpeg') {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `You are an expert forensic image analyst for a civic complaint platform.
Analyze this image and determine if it is:
1. A REAL photograph taken by a phone/camera at an actual location
2. An AI-GENERATED image (by tools like DALL-E, Midjourney, Stable Diffusion, etc.)
3. A MANIPULATED/DOCTORED image

Look for these indicators of AI generation:
- Unnatural lighting, shadows, or reflections
- Distorted text, signs, or numbers
- Unusual hands, faces, or body proportions
- Overly smooth or plastic-looking surfaces
- Repetitive patterns or textures
- Inconsistent perspective or depth
- Missing or floating objects
- Unnatural backgrounds or edges

Return ONLY a valid JSON object with NO additional text:
{
  "isAIGenerated": <boolean>,
  "confidenceScore": <decimal 0.0 to 1.0>,
  "verdict": "<one of: authentic, suspicious, fake>",
  "details": "<Brief explanation of your analysis>"
}`;

    const modelContent = [
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64ImageData
        }
      }
    ];

    const { result, modelUsed } = await callGeminiWithRetry(genAI, modelContent);
    const rawText = result.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { isAIGenerated: false, confidenceScore: 0.5, verdict: 'suspicious', details: 'Unable to analyze image.' };
    }

    const verification = JSON.parse(jsonMatch[0]);

    // Normalize
    if (typeof verification.isAIGenerated !== 'boolean') verification.isAIGenerated = false;
    if (typeof verification.confidenceScore !== 'number') verification.confidenceScore = 0.5;
    if (!['authentic', 'suspicious', 'fake'].includes(verification.verdict)) verification.verdict = 'suspicious';

    console.log(`✅ Image verification completed via ${modelUsed}`);
    return verification;
  } catch (error) {
    console.error('Image Verification Error (all retries exhausted):', error.message);
    return { isAIGenerated: false, confidenceScore: 0.5, verdict: 'suspicious', details: 'Verification service temporarily unavailable. Will retry on next request.' };
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

  // Check sensitivity
  const isSensitive = SENSITIVE_KEYWORDS.some(k => text.includes(k));

  console.log('⚠️ Using keyword fallback engine (Gemini unavailable)');

  return {
    category: detectedCategory,
    priority: urgencyScore >= 8 ? 'critical' : urgencyScore >= 5 ? 'high' : 'medium',
    sentiment: 'concerned',
    keywords: text.split(/\s+/).slice(0, 6),
    summary: `Civic issue reported: ${title}`,
    confidence: 0.55,
    urgency_score: urgencyScore,
    suggested_resolution: 'Manual inspection recommended. AI fallback mode active — verify on-site.',
    is_sensitive: isSensitive,
    imageRequired: !isSensitive && shouldRequireImage(detectedCategory, title, description, urgencyScore),
    source: 'fallback'
  };
}

module.exports = { analyzeComplaint, verifyImage, shouldRequireImage };
