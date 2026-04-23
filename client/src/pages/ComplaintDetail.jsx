import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useComplaintStore, useAuthStore } from '../store';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentComplaint, loading, fetchComplaint, voteComplaint } = useComplaintStore();
  const user = useAuthStore(s => s.user);
  const [voting, setVoting] = useState(false);

  useEffect(() => { fetchComplaint(id); }, [id]);

  const handleVote = async (type) => {
    setVoting(true);
    try {
      await voteComplaint(id, type);
      await fetchComplaint(id);
    } catch {}
    setVoting(false);
  };

  if (loading || !currentComplaint) {
    return (
      <div className="text-center text-muted" style={{ padding: 60 }}>
        <div className="animate-spin" style={{ fontSize: 32 }}>⚙️</div>
        <p style={{ marginTop: 12 }}>Loading Report...</p>
      </div>
    );
  }

  const c = currentComplaint;
  const ai = c.aiAnalysis || {};
  const urgencyColor = ai.urgency_score >= 8 ? 'var(--color-error)' : ai.urgency_score >= 5 ? '#F97316' : 'var(--color-success)';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="detail-page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Back</button>

      {/* Header with Category Background */}
      <div 
        className="card card-lg" 
        style={{ 
          marginBottom: 16, 
          position: 'relative', 
          overflow: 'hidden',
          padding: 0,
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(/categories/cat_${c.category || 'other'}.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5,
            zIndex: 0
          }}
        />
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to top, rgba(18,18,18,1) 10%, rgba(18,18,18,0.7) 60%, transparent)',
            zIndex: 1
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 2, padding: '24px 20px', background: 'linear-gradient(to top, rgba(18,18,18,0.9) 0%, rgba(18,18,18,0.6) 50%, rgba(18,18,18,0.3) 100%)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 12 }}>
            <span className={`badge badge-${c.status}`} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>{c.status?.replace('_', ' ')}</span>
            <span className={`badge badge-${c.urgency}`} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>{c.urgency}</span>
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 8, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{c.title}</h1>
          <p className="text-secondary" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', color: '#eee' }}>{c.description}</p>
          <div style={{ display:'flex', gap:16, marginTop:16 }} className="micro text-muted">
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>By {c.user?.name}</span>
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Level {c.user?.level}</span>
            <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* AI Intelligence Panel */}
      <div className="glass-panel" style={{ marginBottom: 16 }}>
        <h3 className="text-info" style={{ marginBottom: 16 }}>🧠 Civic Intelligence</h3>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <p className="micro text-muted">Category</p>
            <p style={{ fontWeight: 700, textTransform: 'capitalize' }}>{ai.category}</p>
          </div>
          <div>
            <p className="micro text-muted">Sentiment</p>
            <p style={{ fontWeight: 700, textTransform: 'capitalize' }}>{ai.sentiment}</p>
          </div>
          <div>
            <p className="micro text-muted">Confidence</p>
            <div className="progress-bar" style={{ marginTop: 4 }}>
              <div className="progress-bar-fill" style={{ width: `${(ai.confidence || 0) * 100}%` }} />
            </div>
            <p className="micro text-muted" style={{ marginTop: 2 }}>{((ai.confidence || 0) * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="micro text-muted">Urgency Score</p>
            <p style={{ fontWeight: 800, fontSize: 24, color: urgencyColor }}>{ai.urgency_score}/10</p>
          </div>
        </div>

        {ai.suggested_resolution && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 12 }}>
            <p className="micro text-info" style={{ marginBottom: 4 }}>RESOLUTION HINT</p>
            <p style={{ fontSize: 13, color: 'var(--color-info)' }}>{ai.suggested_resolution}</p>
          </div>
        )}

        {ai.keywords?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
            {ai.keywords.map((k, i) => (
              <span key={i} className="badge" style={{ background:'var(--color-surface)', fontSize:11 }}>{k}</span>
            ))}
          </div>
        )}
        <p className="micro text-muted" style={{ marginTop: 12 }}>Source: {ai.source === 'gemini' ? 'Gemini 2.5 Flash' : 'Fallback Engine'}</p>
      </div>

      {/* Community Voting */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Community Validation</h3>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <button className="btn btn-sm btn-secondary" onClick={() => handleVote('up')} disabled={voting}
            style={{ color: 'var(--color-success)' }}>▲ Verify ({c.upvotes?.length || 0})</button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleVote('down')} disabled={voting}
            style={{ color: 'var(--color-error)' }}>▼ Dispute ({c.downvotes?.length || 0})</button>
        </div>
      </div>

      {/* Location */}
      {c.location?.coordinates?.[0] !== 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>📍 Location</h3>
          <p className="text-secondary body-sm">
            {c.location.address || `${c.location.coordinates[1]}, ${c.location.coordinates[0]}`}
          </p>
        </div>
      )}

      <style>{`
        .detail-page { max-width: 560px; margin: 0 auto; }
      `}</style>
    </motion.div>
  );
}
