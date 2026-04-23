import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { motion } from 'framer-motion';

const sosIcon = L.divIcon({
  className: 'sos-marker',
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#EF4444;border:3px solid #fff;box-shadow:0 0 20px rgba(239,68,68,0.8);animation: pulse 1s infinite;"></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12]
});

export default function AdminSOS() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/sos/active');
      setAlerts(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/sos/${id}/status`, { status });
      fetchAlerts();
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className="admin-sos">
      <header style={{ marginBottom: 24 }}>
        <h1>🚨 SOS Emergency Dashboard</h1>
        <p className="text-secondary body-sm">Real-time monitoring of distress signals across the city.</p>
      </header>

      <div className="sos-layout">
        {/* Active Alerts Map */}
        <div className="sos-map-container card">
          <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '500px', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />
            {alerts.map(alert => (
              <div key={alert._id}>
                <Marker position={[alert.location.lat, alert.location.lng]} icon={sosIcon}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <p style={{ fontWeight: 800, color: '#EF4444' }}>🚨 SOS ALERT</p>
                      <p style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{alert.userName}</p>
                      <p style={{ fontSize: 12, opacity: 0.8 }}>Status: {alert.status.toUpperCase()}</p>
                      <hr style={{ margin: '8px 0', opacity: 0.1 }} />
                      <a 
                        href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-sm btn-primary w-full"
                        style={{ fontSize: 10 }}
                      >
                        Navigate to Location
                      </a>
                    </div>
                  </Popup>
                </Marker>
                <Circle 
                  center={[alert.location.lat, alert.location.lng]} 
                  radius={200} 
                  pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.1, weight: 1 }}
                />
              </div>
            ))}
          </MapContainer>
        </div>

        {/* Alerts List */}
        <div className="sos-list">
          <h2 className="label" style={{ marginBottom: 16 }}>Live Alerts ({alerts.length})</h2>
          {alerts.length === 0 ? (
            <div className="card text-center" style={{ padding: 40 }}>
              <p style={{ fontSize: 32 }}>✅</p>
              <p className="text-secondary" style={{ marginTop: 8 }}>All clear. No active SOS alerts.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.map(alert => (
                <motion.div 
                  key={alert._id} 
                  className={`sos-card status-${alert.status}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="sos-card-header">
                    <span className="sos-badge">HIGH PRIORITY</span>
                    <span className="sos-time">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <h3 style={{ margin: '8px 0' }}>{alert.userName}</h3>
                  <p className="micro text-secondary">📍 {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}</p>
                  
                  <div className="sos-notified" style={{ marginTop: 12 }}>
                    <p className="micro">Notified Contacts:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {alert.notifiedContacts.map((c, i) => (
                        <span key={i} className="c-tag">{c.name}</span>
                      ))}
                    </div>
                  </div>

                  <div className="sos-actions" style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                    {alert.status === 'active' && (
                      <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => updateStatus(alert._id, 'responding')}>
                        Start Response
                      </button>
                    )}
                    {alert.status === 'responding' && (
                      <button className="btn btn-sm btn-success" style={{ flex: 1 }} onClick={() => updateStatus(alert._id, 'resolved')}>
                        Mark Resolved
                      </button>
                    )}
                    <a href={`tel:${alert.userPhone || ''}`} className="btn btn-sm btn-secondary">📞</a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .sos-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
        .sos-map-container { border-radius: 24px; overflow: hidden; height: 500px; }
        .sos-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 20px; padding: 20px; border-left: 4px solid #EF4444; }
        .sos-card-header { display: flex; justify-content: space-between; align-items: center; }
        .sos-badge { background: #EF4444; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
        .sos-time { font-size: 11px; opacity: 0.6; }
        .c-tag { font-size: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--color-border); padding: 2px 6px; border-radius: 4px; }
        
        .status-responding { border-left-color: var(--color-warning); }
        
        @media (max-width: 900px) {
          .sos-layout { grid-template-columns: 1fr; }
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
