import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useComplaintStore } from '../store';

// ─── Custom Icons ────────────────────────────────────────────────────────────

const getSeverityColor = (score) => {
  if (score >= 8) return '#EF4444'; // Emergency (Red)
  if (score >= 5) return '#EAB308'; // Medium (Yellow)
  return '#22C55E';                 // Low (Green)
};

const createIcon = (score) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:${getSeverityColor(score)};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5); ${score >= 8 ? 'animation: pulse 1.5s infinite;' : ''}"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9]
});

const resourceIcon = (type) => L.divIcon({
  className: 'resource-marker',
  html: `<div style="font-size: 20px; line-height: 1; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">${type === 'hospital' ? '🏥' : type === 'police' ? '🚓' : '👷'}</div>`,
  iconSize: [24, 24], iconAnchor: [12, 12]
});

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="font-size: 16px; line-height: 1; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">🧍</div>`,
  iconSize: [16, 16], iconAnchor: [8, 8]
});

const TILE_LAYERS = {
  street: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', name: 'Street' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: 'Dark Mode' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', name: 'Satellite' }
};

// ─── Map Helpers ─────────────────────────────────────────────────────────────

function MapController({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 16, { duration: 1.2 }); }, [position, map]);
  return null;
}

function MapEvents({ setClickPos }) {
  useMapEvents({
    click(e) {
      setClickPos([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function MapView() {
  const { complaints, fetchComplaints } = useComplaintStore();
  const [layer, setLayer] = useState('street');
  const [flyTo, setFlyTo] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [clickPos, setClickPos] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState({
    emergencyOnly: false,
    showResources: false,
    showUsers: false,
    statuses: ['pending', 'assigned', 'in_progress'],
    categories: [] // empty means all
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Fetch complaints + 6. Live polling every 15s
  useEffect(() => {
    fetchComplaints({ limit: 200 });
    const interval = setInterval(() => fetchComplaints({ limit: 200 }), 15000);
    navigator.geolocation?.getCurrentPosition(
      (p) => setUserPos([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
    return () => clearInterval(interval);
  }, [fetchComplaints]);

  // Map Center
  const defaultCenter = userPos || [12.9716, 77.5946];

  // Generate Mock Resources & Users based on center
  const mockResources = useMemo(() => [
    { id: 1, type: 'hospital', lat: defaultCenter[0] + 0.005, lng: defaultCenter[1] + 0.005, name: 'City General Hospital' },
    { id: 2, type: 'police', lat: defaultCenter[0] - 0.005, lng: defaultCenter[1] - 0.002, name: 'Central Police Station' },
    { id: 3, type: 'worker', lat: defaultCenter[0] + 0.002, lng: defaultCenter[1] + 0.008, name: 'Sanitation Crew Alpha' }
  ], [defaultCenter]);

  const mockUsers = useMemo(() => [
    { id: 1, lat: defaultCenter[0] + 0.003, lng: defaultCenter[1] - 0.004, name: 'Validator: Raj' },
    { id: 2, lat: defaultCenter[0] - 0.006, lng: defaultCenter[1] + 0.003, name: 'Active User' }
  ], [defaultCenter]);

  // 4. Status, 9. Problem Type, and 10. Emergency filtering
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // Validate coordinates
      if (!c.location?.coordinates || c.location.coordinates[0] === 0) return false;
      
      const score = c.aiAnalysis?.urgency_score || 0;
      
      // Emergency Mode filter
      if (filters.emergencyOnly && score < 8) return false;
      
      // Status filter
      if (!filters.statuses.includes(c.status) && !filters.emergencyOnly) return false;
      
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(c.category)) return false;

      return true;
    });
  }, [complaints, filters]);

  // Toggle helpers
  const toggleStatus = (st) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(st) ? prev.statuses.filter(s => s !== st) : [...prev.statuses, st]
    }));
  };

  const toggleCategory = (cat) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat]
    }));
  };

  // Map Action Handlers
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setFlyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = [p.coords.latitude, p.coords.longitude];
        setUserPos(pos);
        setFlyTo(pos);
        setLoadingLocation(false);
      },
      (err) => {
        console.error('Location error:', err);
        setLoadingLocation(false);
        alert('Could not get precise location. Using last known or default.');
        if (userPos) setFlyTo(userPos);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReportFromMap = async () => {
    if (!clickPos) return;
    
    try {
      // Reverse Geocoding for the pinned location
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickPos[0]}&lon=${clickPos[1]}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await response.json();
      let cleanAddress = 'Selected from Intelligence Map';
      
      if (data && data.display_name) {
        const addr = data.address;
        const landmark = data.name || addr.road || addr.suburb || '';
        const area = addr.suburb || addr.neighborhood || addr.city_district || addr.city || '';
        
        cleanAddress = landmark && area && landmark !== area 
          ? `${landmark}, ${area}` 
          : data.display_name.split(',').slice(0, 3).join(',');
      }
      
      navigate('/submit', { state: { lat: clickPos[0], lng: clickPos[1], address: cleanAddress } });
    } catch (err) {
      console.error('Geocoding error:', err);
      navigate('/submit', { state: { lat: clickPos[0], lng: clickPos[1], address: 'Selected from Intelligence Map' } });
    }
  };

  return (
    <div className={`map-page ${isFullscreen ? 'fullscreen-mode' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Top Bar Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          🗺️ Intelligence Map
          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? '✖ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </h2>
        
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${filters.emergencyOnly ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => {
              setFilters(prev => ({ ...prev, emergencyOnly: !prev.emergencyOnly }));
              setLayer(filters.emergencyOnly ? 'street' : 'dark'); // switch to dark mode in emergency
            }}
            style={filters.emergencyOnly ? { animation: 'pulse 1s infinite' } : {}}
          >
            🚨 Emergency Mode
          </button>
          <button className={`btn btn-sm ${filters.showResources ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilters(prev => ({ ...prev, showResources: !prev.showResources }))}>
            🏥 Resources
          </button>
          <button className={`btn btn-sm ${filters.showUsers ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilters(prev => ({ ...prev, showUsers: !prev.showUsers }))}>
            🧍 Users
          </button>
          
          <select 
            className="input" 
            style={{ width: 'auto', padding: '4px 8px', height: '32px', fontSize: '12px' }}
            value={layer} 
            onChange={e => setLayer(e.target.value)}
          >
            {Object.entries(TILE_LAYERS).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input 
          className="input" 
          placeholder="Search location..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          style={{ flex: 1, height: 36 }}
        />
        <button type="submit" className="btn btn-secondary" style={{ height: 36 }}>🔍 Search</button>
      </form>

      {/* Filter Chips */}
      {!filters.emergencyOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {/* Status Filters */}
          <div className="filter-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {['pending', 'assigned', 'in_progress', 'resolved'].map(st => (
              <span 
                key={st} 
                onClick={() => toggleStatus(st)}
                className={`badge ${filters.statuses.includes(st) ? 'badge-info' : 'bg-surface'}`}
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', opacity: filters.statuses.includes(st) ? 1 : 0.6 }}
              >
                {st.replace('_', ' ').toUpperCase()}
              </span>
            ))}
          </div>
          {/* Category Filters */}
          <div className="filter-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {['roads', 'water', 'garbage', 'safety', 'electrical', 'other'].map(cat => (
              <span 
                key={cat} 
                onClick={() => toggleCategory(cat)}
                className={`badge ${filters.categories.includes(cat) ? 'badge-primary' : 'bg-surface'}`}
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', opacity: filters.categories.includes(cat) ? 1 : 0.6, fontSize: 10 }}
              >
                {cat.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div style={{ flex: 1, minHeight: '400px', borderRadius: 16, overflow: 'hidden', border: `2px solid ${filters.emergencyOnly ? '#EF4444' : 'var(--color-border)'}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <MapContainer center={defaultCenter} zoom={13} style={{ flex: 1, width: '100%', minHeight: '400px' }} zoomControl={false}>
          <TileLayer url={TILE_LAYERS[layer].url} attribution="CivicX" />
          <MapController position={flyTo} />
          <MapEvents setClickPos={setClickPos} />

          {/* 3. AI Priority Heatmap (Mocked via translucent circles for critical areas) */}
          {filteredComplaints.filter(c => c.aiAnalysis?.urgency_score >= 8).map(c => (
            <Circle 
              key={`heat-${c._id}`} 
              center={[c.location.coordinates[1], c.location.coordinates[0]]} 
              radius={150} 
              pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.2, stroke: false }} 
            />
          ))}

          {/* 5. Resources Layer */}
          {filters.showResources && mockResources.map(r => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={resourceIcon(r.type)}>
              <Popup><strong>{r.name}</strong><br/>Type: {r.type.toUpperCase()}</Popup>
            </Marker>
          ))}

          {/* 8. Users Layer */}
          {filters.showUsers && mockUsers.map(u => (
            <Marker key={u.id} position={[u.lat, u.lng]} icon={userIcon}>
              <Popup>{u.name}</Popup>
            </Marker>
          ))}

          {/* User Position */}
          {userPos && (
            <Marker position={userPos} icon={L.divIcon({
              className: 'user-pos-marker',
              html: `<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 12px rgba(59,130,246,0.8);"></div>`,
              iconSize: [16, 16], iconAnchor: [8, 8]
            })}>
              <Popup>📍 You are here</Popup>
            </Marker>
          )}

          {/* Click to Report Marker */}
          {clickPos && (
            <Marker position={clickPos} icon={L.divIcon({
              className: 'click-marker',
              html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🎯</div>`,
              iconSize: [24, 24], iconAnchor: [12, 24]
            })}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: 140 }}>
                  <strong>Report Issue Here?</strong>
                  <p className="micro text-muted" style={{ margin: '4px 0 8px' }}>
                    {filteredComplaints.filter(c => {
                      const dist = Math.hypot(c.location.coordinates[1] - clickPos[0], c.location.coordinates[0] - clickPos[1]);
                      return dist < 0.005; // Roughly 500m
                    }).length} existing reports nearby.
                  </p>
                  <button className="btn btn-primary btn-sm w-full" onClick={handleReportFromMap}>
                    Proceed to Report
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 2. Clustered Complaints with Smart Severity Icons */}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={40}
            iconCreateFunction={(cluster) => {
              const markers = cluster.getAllChildMarkers();
              // Calculate average severity of cluster
              let maxSeverity = 0;
              markers.forEach(m => {
                if (m.options.severity > maxSeverity) maxSeverity = m.options.severity;
              });
              
              const color = getSeverityColor(maxSeverity);
              const count = cluster.getChildCount();
              
              return L.divIcon({
                html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">${count}</div>`,
                className: 'custom-cluster-icon',
                iconSize: L.point(32, 32, true)
              });
            }}
          >
            {filteredComplaints.map((c) => {
              const score = c.aiAnalysis?.urgency_score || 0;
              return (
                <Marker
                  key={c._id}
                  position={[c.location.coordinates[1], c.location.coordinates[0]]}
                  icon={createIcon(score)}
                  severity={score} // Custom prop for cluster calculation
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      {/* 7. Image Preview */}
                      {c.images && c.images.length > 0 && (
                        <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', height: 100, background: '#eee' }}>
                          <img src={c.images[0]} alt="Complaint preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <strong>{c.title}</strong>
                      <p style={{ fontSize: 12, margin: '4px 0', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {c.description}
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span className={`badge badge-${c.status === 'resolved' ? 'success' : 'info'}`} style={{ fontSize: 10 }}>
                          {c.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {score >= 8 && <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 11 }}>🚨 CRITICAL</span>}
                      </div>
                      
                      <button style={{ marginTop: 10, padding: '6px 12px', background: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700, width: '100%' }}
                        onClick={() => navigate(`/complaint/${c._id}`)}>Open Report</button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Floating Controls Overlay */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            onClick={handleMyLocation}
            disabled={loadingLocation}
            style={{ 
              width: 44, height: 44, borderRadius: '50%', 
              background: 'var(--color-primary)', border: 'none', 
              color: '#000', fontSize: 20, cursor: 'pointer', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: loadingLocation ? 'spin 1s infinite linear' : 'none'
            }}
            title="My Location"
          >
            {loadingLocation ? '⌛' : '🎯'}
          </button>
        </div>

        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: 12, zIndex: 1000, color: 'white', fontSize: 12, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><div style={{ width:12, height:12, borderRadius:'50%', background:'#EF4444' }}/> Emergency (≥8)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><div style={{ width:12, height:12, borderRadius:'50%', background:'#EAB308' }}/> Medium (5-7)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width:12, height:12, borderRadius:'50%', background:'#22C55E' }}/> Low (&lt;5)</div>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          position: absolute !important;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          height: 100% !important;
          width: 100% !important;
          z-index: 1;
        }
        .filter-scroll::-webkit-scrollbar { display: none; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .fullscreen-mode {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 9999 !important;
          background: var(--color-background);
          padding: 16px !important;
          height: 100vh !important;
        }
      `}</style>
    </div>
  );
}

