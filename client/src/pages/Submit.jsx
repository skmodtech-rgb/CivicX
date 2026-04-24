import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useComplaintStore } from '../store';

const STEPS = ['Details', 'Evidence', 'Location', 'Review'];

// Categories where image is typically mandatory
const IMAGE_MANDATORY_CATEGORIES = ['pothole', 'streetlight', 'water', 'sewage', 'garbage', 'encroachment', 'electrical'];
// Sensitive categories where image is NEVER mandatory
const SENSITIVE_KEYWORDS = ['women safety', 'harassment', 'stalking', 'threat', 'abuse', 'domestic violence'];

function isSensitiveContent(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  return SENSITIVE_KEYWORDS.some(k => text.includes(k));
}

function isImageRecommended(category, title, description) {
  if (isSensitiveContent(title, description)) return false;
  return IMAGE_MANDATORY_CATEGORIES.includes(category);
}

export default function Submit() {
  const location = useLocation();
  const navState = location.state || {};

  const [step, setStep] = useState(0); // Always start at Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [lat, setLat] = useState(navState.lat || '');
  const [lng, setLng] = useState(navState.lng || '');
  const [address, setAddress] = useState(navState.address || (navState.lat ? 'Selected from Intelligence Map' : ''));

  // Auto-locate if no location provided from map
  useEffect(() => {
    if (!navState.lat && !lat) {
      autoLocate();
    }
  }, []);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const { submitComplaint } = useComplaintStore();
  const navigate = useNavigate();

  const imageRequired = isImageRecommended(category, title, description);
  const sensitive = isSensitiveContent(title, description);



  // ─── Image Upload ────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (photoFiles.length + files.length > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPhotoFiles(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    setError('');
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Live Camera ─────────────────────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob && photoFiles.length < 5) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFiles(prev => [...prev, file]);
        setPhotoPreviews(prev => [...prev, URL.createObjectURL(blob)]);
      }
    }, 'image/jpeg', 0.85);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  // ─── Geolocation ─────────────────────────────────────
  const autoLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const latitude = pos.coords.latitude.toFixed(6);
      const longitude = pos.coords.longitude.toFixed(6);
      setLat(latitude);
      setLng(longitude);
      setAddress('Locating...');

      try {
        // Reverse Geocoding using Nominatim (OpenStreetMap)
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await response.json();
        
        if (data && data.display_name) {
          // Construct a cleaner address (Landmark + Area)
          const addr = data.address;
          const landmark = data.name || addr.road || addr.suburb || '';
          const area = addr.suburb || addr.neighborhood || addr.city_district || addr.city || '';
          
          const cleanAddress = landmark && area && landmark !== area 
            ? `${landmark}, ${area}` 
            : data.display_name.split(',').slice(0, 3).join(','); // Fallback to first 3 parts of full name
          
          setAddress(cleanAddress);
        } else {
          setAddress('Current GPS Location');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setAddress('Current GPS Location');
      }
    }, () => setError('Location access denied.'));
  };

  // ─── Submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    // Enforce image for mandatory categories
    if (imageRequired && photoFiles.length === 0) {
      setError(`Photo evidence is required for ${category} complaints. Please upload or capture an image.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
        address
      }));

      photoFiles.forEach(file => formData.append('photos', file));

      const data = await submitComplaint(formData);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  // ─── Success Screen ──────────────────────────────────
  if (result) {
    const iv = result.imageVerification;
    return (
      <motion.div className="submit-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="card card-lg text-center" style={{ padding: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2>Intelligence Verified!</h2>
          <p className="text-secondary" style={{ margin: '12px 0' }}>Your civic report has been filed and analyzed.</p>

          <div className="glass-panel" style={{ margin: '20px 0', textAlign: 'left' }}>
            <p className="micro text-info" style={{ marginBottom: 8 }}>AI ANALYSIS</p>
            <p><strong>Category:</strong> {result.complaint?.aiAnalysis?.category}</p>
            <p><strong>Priority:</strong> <span className={`badge badge-${result.complaint?.aiAnalysis?.priority}`}>{result.complaint?.aiAnalysis?.priority}</span></p>
            <p><strong>Confidence:</strong> {(result.complaint?.aiAnalysis?.confidence * 100).toFixed(0)}%</p>
            <p style={{ marginTop: 8 }}><strong>Resolution Hint:</strong></p>
            <p className="text-info" style={{ fontSize: 13 }}>{result.complaint?.aiAnalysis?.suggested_resolution}</p>
          </div>

          {/* Image Verification Results */}
          {iv && iv.verdict !== 'not_required' && (
            <div className={`glass-panel ${iv.verdict === 'fake' ? 'verdict-fake' : iv.verdict === 'suspicious' ? 'verdict-suspicious' : 'verdict-authentic'}`}
              style={{ margin: '12px 0', textAlign: 'left' }}>
              <p className="micro" style={{ marginBottom: 8 }}>
                {iv.verdict === 'authentic' ? '🟢 IMAGE VERIFIED' : iv.verdict === 'suspicious' ? '🟡 IMAGE SUSPICIOUS' : '🔴 FAKE IMAGE DETECTED'}
              </p>
              {iv.results?.map((r, i) => (
                <p key={i} className="body-sm" style={{ marginBottom: 4 }}>
                  Image {i + 1}: {r.isAIGenerated ? '⚠️ AI-Generated' : '✅ Authentic'} ({(r.confidenceScore * 100).toFixed(0)}% confidence)
                  {r.analysisDetails && <span className="text-muted" style={{ display: 'block', fontSize: 12 }}>{r.analysisDetails}</span>}
                </p>
              ))}
            </div>
          )}

          <div className="text-primary-brand" style={{ fontSize: 20, fontWeight: 800, margin: '12px 0' }}>
            +{result.pointsAwarded} XP Earned
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => navigate(`/complaint/${result.complaint?._id}`)}>View Report</button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="submit-page">
      {/* Progress Steps */}
      <div className="steps-bar">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i <= step ? 'step-active' : ''} ${i < step ? 'step-done' : ''}`}>
            <div className="step-dot">{i < step ? '✓' : i + 1}</div>
            <span className="micro">{s}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

          {/* Step 1: Details */}
          {step === 0 && (
            <div className="step-content">
              <h2>📋 Report Details</h2>
              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="micro text-muted">Issue Title</label>
                <input className="input" placeholder="e.g. Massive pothole on MG Road" value={title}
                  onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="micro text-muted">Description</label>
                <textarea className="input" placeholder="Describe the issue in detail..." value={description}
                  onChange={e => setDescription(e.target.value)} rows={4} />

              </div>
              <div className="form-group">
                <label className="micro text-muted">Category (AI will auto-classify)</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {['garbage', 'water', 'pothole', 'streetlight', 'sewage', 'traffic', 'electricity', 'police', 'fire', 'other']
                    .map(c => <option key={c} value={c}>{c === 'keb' ? 'Electricity (KEB)' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {/* Smart Image Requirement Notice */}
              {sensitive && (
                <div className="notice notice-info">
                  🛡️ <strong>Privacy Protected:</strong> Image upload is optional for sensitive complaints. Your safety is our priority.
                </div>
              )}

              <button className="btn btn-primary w-full" disabled={!title || !description} onClick={() => setStep(1)}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Evidence (Images) */}
          {step === 1 && (
            <div className="step-content">
              <h2>📷 Photo Evidence</h2>
              <p className="body-sm text-secondary" style={{ marginBottom: 16 }}>
                {imageRequired
                  ? '⚠️ Photo evidence is required for this type of complaint.'
                  : 'Photo evidence is optional but helps verify and prioritize your report (+20 XP).'}
              </p>

              {/* Camera View */}
              {cameraOpen && (
                <div className="camera-container">
                  <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="camera-controls">
                    <button className="btn btn-secondary btn-sm" onClick={closeCamera}>✕ Close</button>
                    <button className="btn btn-primary camera-shutter" onClick={capturePhoto}>
                      <div className="shutter-ring" />
                    </button>
                    <span className="micro text-muted">{photoFiles.length}/5</span>
                  </div>
                </div>
              )}

              {/* Upload Buttons */}
              {!cameraOpen && (
                <div className="evidence-actions">
                  <button className="btn btn-secondary" onClick={openCamera}>
                    📸 Live Camera
                  </button>
                  <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                    📁 Upload Photos
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFileSelect} />
                </div>
              )}

              {/* Preview Grid */}
              {photoPreviews.length > 0 && (
                <div className="photo-grid">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="photo-thumb">
                      <img src={src} alt={`Evidence ${i + 1}`} />
                      <button className="photo-remove" onClick={() => removePhoto(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-error" style={{ marginTop: 8, fontSize: 13 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={imageRequired && photoFiles.length === 0}
                  onClick={() => { setError(''); setStep(2); }}
                >
                  {imageRequired && photoFiles.length === 0 ? 'Photo Required' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 2 && (
            <div className="step-content">
              <h2>📍 Location</h2>
              <button className="btn btn-secondary w-full" onClick={autoLocate} style={{ marginTop: 16 }}>
                📡 Use Current GPS Location
              </button>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="micro text-muted">Latitude</label>
                  <input className="input" placeholder="12.9716" value={lat} onChange={e => setLat(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="micro text-muted">Longitude</label>
                  <input className="input" placeholder="77.5946" value={lng} onChange={e => setLng(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="micro text-muted">Address / Landmark</label>
                <input className="input" placeholder="Near City Park, Sector 5" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="step-content">
              <h2>🔍 Review & Submit</h2>
              <div className="glass-panel" style={{ marginTop: 16 }}>
                <p><strong>Title:</strong> {title}</p>
                <p style={{ margin: '8px 0' }}><strong>Description:</strong> {description?.substring(0, 200)}</p>
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Location:</strong> {lat && lng ? `${lat}, ${lng}` : 'Not set'} {address && `(${address})`}</p>
                <p><strong>Photos:</strong> {photoFiles.length} attached</p>
              </div>

              {/* Photo Review Thumbnails */}
              {photoPreviews.length > 0 && (
                <div className="photo-grid" style={{ marginTop: 12 }}>
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="photo-thumb photo-thumb-sm">
                      <img src={src} alt={`Review ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-error" style={{ marginTop: 12, fontSize: 13 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '🧠 AI Analyzing & Verifying...' : '🚀 Submit Report'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <style>{`
        .submit-page { max-width: 540px; margin: 0 auto; }
        .steps-bar { display:flex; justify-content:center; gap:24px; margin-bottom:28px; }
        .step { display:flex; flex-direction:column; align-items:center; gap:6px; opacity:0.4; transition:all 0.3s; }
        .step-active { opacity:1; }
        .step-dot { width:32px; height:32px; border-radius:50%; background:var(--color-surface); border:2px solid var(--color-border); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; transition:all 0.3s; }
        .step-active .step-dot { border-color:var(--color-primary); color:var(--color-primary); }
        .step-done .step-dot { background:var(--color-primary); color:#000; border-color:var(--color-primary); }
        .step-content { display:flex; flex-direction:column; gap:16px; }
        .form-group { display:flex; flex-direction:column; gap:8px; }
        .submit-success { display:flex; justify-content:center; padding:20px 0; }



        /* Notice */
        .notice { padding:12px 16px; border-radius:12px; font-size:13px; line-height:1.5; }
        .notice-info { background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2); color:var(--color-info); }

        /* Evidence Actions */
        .evidence-actions { display:flex; gap:12px; }
        .evidence-actions .btn { flex:1; }

        /* Photo Grid */
        .photo-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:8px; margin-top:16px; }
        .photo-thumb { position:relative; aspect-ratio:1; border-radius:12px; overflow:hidden; border:2px solid var(--color-border); }
        .photo-thumb img { width:100%; height:100%; object-fit:cover; }
        .photo-thumb-sm { border-width:1px; }
        .photo-remove { position:absolute; top:4px; right:4px; width:24px; height:24px; border-radius:50%; background:rgba(0,0,0,0.7); color:white; font-size:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; transition:background 0.2s; }
        .photo-remove:hover { background:var(--color-error); }

        /* Camera */
        .camera-container { position:relative; border-radius:16px; overflow:hidden; background:#000; margin-bottom:16px; }
        .camera-preview { width:100%; max-height:400px; object-fit:cover; display:block; }
        .camera-controls { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:rgba(0,0,0,0.7); }
        .camera-shutter { width:56px!important; height:56px!important; border-radius:50%!important; background:white!important; padding:0!important; display:flex; align-items:center; justify-content:center; }
        .shutter-ring { width:44px; height:44px; border-radius:50%; border:3px solid #333; }

        /* Verification badges */
        .verdict-authentic { border-color:rgba(34,197,94,0.3)!important; }
        .verdict-suspicious { border-color:rgba(234,179,8,0.3)!important; }
        .verdict-fake { border-color:rgba(239,68,68,0.3)!important; background:rgba(239,68,68,0.05)!important; }
      `}</style>
    </div>
  );
}
