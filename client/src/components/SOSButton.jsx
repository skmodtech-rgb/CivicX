import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function SOSButton() {
  const [isActivating, setIsActivating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, countdown, triggering, active
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const startSOS = (e) => {
    e?.stopPropagation();
    setIsActivating(true);
    setStatus('countdown');
    setTimer(3);
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(intervalRef.current);
    setIsActivating(false);
    setStatus('idle');
    setTimer(0);
  };

  const triggerSOS = async () => {
    setStatus('triggering');
    try {
      // 1. Get Location (Enhanced Accuracy)
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout for mobile
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // 2. Call API
      await api.post('/sos/trigger', { lat: latitude, lng: longitude });
      
      setStatus('active');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
      
      setTimeout(() => {
        setIsActivating(false);
        setStatus('idle');
      }, 4000);

    } catch (err) {
      console.error('SOS Error:', err);
      setError(err.code === 1 ? 'Location permission denied.' : 'Location fetch timed out.');
      setStatus('error');
      setTimeout(cancelSOS, 3000);
    }
  };

  return (
    <>
      {/* Compact Header Button */}
      <motion.button
        className={`sos-header-btn ${status === 'active' ? 'active' : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={status === 'idle' ? startSOS : undefined}
      >
        <span className="sos-icon">🚨</span>
        <span className="sos-label">{status === 'active' ? 'ALERTED' : 'SOS'}</span>
      </motion.button>

      {/* Activation Overlay */}
      <AnimatePresence>
        {isActivating && (
          <div className="sos-overlay">
            <motion.div 
              className="sos-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {status === 'countdown' && (
                <>
                  <h2 className="sos-title">Triggering SOS</h2>
                  <div className="sos-timer">{timer}</div>
                  <p className="sos-sub">Notifying emergency responders...</p>
                  <button className="sos-cancel" onClick={cancelSOS}>Cancel</button>
                </>
              )}

              {status === 'triggering' && (
                <>
                  <div className="sos-spinner">📡</div>
                  <h2 className="sos-title">Broadcasting...</h2>
                  <p className="sos-sub">Capturing high-accuracy GPS coordinates.</p>
                </>
              )}

              {status === 'active' && (
                <>
                  <div className="sos-success">🚨</div>
                  <h2 className="sos-title">Help is coming!</h2>
                  <p className="sos-sub">Location broadcasted to Admin Dashboard.</p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="sos-error">⚠️</div>
                  <h2 className="sos-title">SOS Failed</h2>
                  <p className="sos-sub">{error}</p>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .sos-header-btn {
          display: flex; align-items: center; gap: 8px;
          background: #EF4444; color: white; padding: 6px 14px;
          border-radius: 12px; border: none; font-weight: 800; font-size: 13px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); transition: all 0.2s;
        }
        .sos-header-btn.active { background: #000; box-shadow: none; }
        .sos-header-btn .sos-icon { font-size: 14px; }
        
        .sos-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 24px;
          color: white; text-align: center;
        }
        .sos-modal { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .sos-title { font-size: 24px; font-weight: 800; }
        .sos-timer { font-size: 80px; font-weight: 900; color: #EF4444; }
        .sos-sub { font-size: 14px; opacity: 0.7; max-width: 240px; }
        .sos-cancel {
          background: #333; color: white; padding: 12px 32px; border-radius: 12px;
          font-weight: 700; border: 1px solid #444; margin-top: 10px;
        }
        .sos-spinner { font-size: 40px; animation: bounce 1s infinite; }
        .sos-success, .sos-error { font-size: 60px; }

        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </>
  );
}
