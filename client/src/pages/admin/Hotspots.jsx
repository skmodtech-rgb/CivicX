import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import api from '../../services/api';

const riskColors = { critical: '#EF4444', high: '#F97316', moderate: '#EAB308' };

export default function AdminHotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/hotspots').then(r => {
      setHotspots(r.data.hotspots);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const center = hotspots.length > 0 ? [hotspots[0].lat, hotspots[0].lng] : [12.9716, 77.5946];

  return (
    <div className="admin-hotspots">
      <h1 style={{ marginBottom: 4 }}>🔥 Hotspot Intelligence</h1>
      <p className="text-secondary body-sm" style={{ marginBottom: 24 }}>
        Areas with 3+ active complaints — clustered at ~110m precision
      </p>

      {loading ? (
        <div className="text-center text-muted" style={{ padding: 60 }}>
          <div className="animate-spin" style={{ fontSize: 32 }}>⚙️</div>
          <p style={{ marginTop: 12 }}>Scanning risk zones...</p>
        </div>
      ) : hotspots.length === 0 ? (
        <div className="card text-center" style={{ padding: 40 }}>
          <p style={{ fontSize: 40 }}>✅</p>
          <h3 style={{ marginTop: 8 }}>No Active Hotspots</h3>
          <p className="text-secondary" style={{ marginTop: 4 }}>The city is looking healthy!</p>
        </div>
      ) : (
        <>
          <div style={{ height: 450, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: 20 }}>
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="CivicX AI" />
              {hotspots.map((h, i) => (
                <CircleMarker key={i} center={[h.lat, h.lng]}
                  radius={Math.min(h.count * 5, 30)}
                  pathOptions={{ color: riskColors[h.riskLevel], fillColor: riskColors[h.riskLevel], fillOpacity: 0.4, weight: 2 }}>
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ {h.riskLevel.toUpperCase()} RISK ZONE</p>
                      <p style={{ fontSize: 12 }}>{h.count} active complaints</p>
                      <p style={{ fontSize: 12 }}>Avg Urgency: {h.avgUrgency}/10</p>
                      <p style={{ fontSize: 11, marginTop: 4, color: '#666' }}>
                        Categories: {h.topCategories.join(', ')}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* Hotspot List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hotspots.map((h, i) => (
              <motion.div key={i} className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${riskColors[h.riskLevel]}` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge badge-${h.riskLevel === 'critical' ? 'critical' : h.riskLevel === 'high' ? 'high' : 'medium'}`}>
                      {h.riskLevel.toUpperCase()}
                    </span>
                    <span className="micro text-muted">{h.count} reports</span>
                  </div>
                  <p className="body-sm text-secondary">
                    📍 {h.lat.toFixed(4)}, {h.lng.toFixed(4)} — {h.topCategories.join(', ')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, fontSize: 22, color: riskColors[h.riskLevel] }}>{h.avgUrgency}</p>
                  <p className="micro text-muted">Avg Urgency</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <style>{`.admin-hotspots { max-width: 900px; }`}</style>
    </div>
  );
}
