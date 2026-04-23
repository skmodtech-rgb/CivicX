import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function SOSButton() {
  const [isActivating, setIsActivating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, countdown, triggering, active
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const startSOS = () => {
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
      // 1. Get Location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // 2. Call API
      await api.post('/sos/trigger', { lat: latitude, lng: longitude });
      
      setStatus('active');
      // Vibration feedback
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
      
      // Auto-dismiss after 5 seconds to show active state on home
      setTimeout(() => {
        setIsActivating(false);
      }, 5000);

    } catch (err) {
      setError(err.code === 1 ? 'Location permission denied.' : 'Failed to broadcast SOS.');
      setStatus('error');
      setTimeout(cancelSOS, 3000);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className={`sos-fab ${status === 'active' ? 'sos-active' : ''}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={status === 'idle' ? startSOS : undefined}
      >
        <div className="sos-ring"></div>
        <div className="sos-inner">
          <span className="sos-text">{status === 'active' ? 'ALERTED' : 'SOS'}</span>
        </div>
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
                  <h2 className="sos-title">Triggering Emergency SOS</h2>
                  <div className="sos-timer">{timer}</div>
                  <p className="sos-sub">Broadcasting location to responders and emergency contacts.</p>
                  <button className="sos-cancel" onClick={cancelSOS}>Tap to Cancel</button>
                </>
              )}

              {status === 'triggering' && (
                <>
                  <div className="sos-spinner">📡</div>
                  <h2 className="sos-title">Broadcasting...</h2>
                  <p className="sos-sub">Capturing live GPS coordinates and notifying contacts.</p>
                </>
              )}

              {status === 'active' && (
                <>
                  <div className="sos-success">🚨</div>
                  <h2 className="sos-title">Help is on the way!</h2>
                  <p className="sos-sub">Your emergency signal has been received. Stay where you are.</p>
                  <div className="sos-contacts-alert">Contacts Notified ✅</div>
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
        .sos-fab {
          position: fixed; bottom: 90px; right: 20px; z-index: 2000;
          width: 72px; height: 72px; border-radius: 50%; padding: 0;
          background: #EF4444; color: white; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 32px rgba(239, 68, 68, 0.5); border: 4px solid rgba(255,255,255,0.2);
        }
        .sos-active { background: #000; box-shadow: 0 0 40px rgba(0,0,0,0.5); }
        .sos-inner { position: relative; z-index: 2; font-weight: 900; font-size: 16px; letter-spacing: 0.05em; }
        .sos-ring {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 4px solid #EF4444; animation: sos-pulse 2s infinite; opacity: 0.6;
        }
        @keyframes sos-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .sos-overlay {
          position: fixed; inset: 0; background: rgba(239, 68, 68, 0.95);
          display: flex; align-items: center; justify-content: center; z-index: 5000; padding: 24px;
          color: white; text-align: center;
        }
        .sos-modal { display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .sos-title { font-size: 28px; font-weight: 800; }
        .sos-timer { font-size: 120px; font-weight: 900; line-height: 1; }
        .sos-sub { font-size: 16px; opacity: 0.9; max-width: 300px; line-height: 1.4; }
        .sos-cancel {
          background: white; color: #EF4444; padding: 16px 40px; border-radius: 40px;
          font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
          margin-top: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .sos-spinner { font-size: 60px; animation: bounce 1s infinite; }
        .sos-success, .sos-error { font-size: 80px; }
        .sos-contacts-alert { background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 8px; font-weight: 700; margin-top: 12px; }

        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>
    </>
  );
}
