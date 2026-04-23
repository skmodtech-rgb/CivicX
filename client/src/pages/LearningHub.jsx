import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

export default function LearningHub() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState({ modules: [], progress: { completedLessons: [], completedQuizzes: [], totalLearningPoints: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/learning/modules', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(res => {
      setData(res);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return <div className="text-center" style={{ padding: 40 }}>Loading Curriculum...</div>;
  }

  const { modules, progress } = data;
  
  const filteredModules = modules.filter(m => {
    const matchType = filter === 'all' || m.type === filter;
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const completedCount = progress.completedQuizzes.length;
  const progressPercent = Math.round((completedCount / (modules.length || 1)) * 100);

  // Next lesson logic: first module where quiz is not passed
  const nextLesson = modules.find(m => !m.quizPassed);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="learning-hub" style={{ paddingBottom: 40 }}>
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--color-primary) 0%, #15803d 100%)', color: '#000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 24, margin: 0 }}>Civic Education</h2>
          <span style={{ fontWeight: 'bold', fontSize: 18 }}>🏆 {progress.totalLearningPoints} pts</span>
        </div>
        
        <p style={{ margin: '0 0 8px 0', fontSize: 14 }}>Your Progress ({completedCount}/{modules.length} Mastered)</p>
        <div className="progress-bar" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, background: '#fff' }} />
        </div>
      </div>

      {nextLesson && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--color-primary)' }}>
          <h3 className="micro text-primary" style={{ marginBottom: 8 }}>RECOMMENDED NEXT</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src={nextLesson.thumbnail} alt={nextLesson.title} style={{ width: 80, height: 60, borderRadius: 8, objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 16 }}>{nextLesson.title}</h4>
              <p className="micro text-muted" style={{ margin: '4px 0 0 0' }}>{nextLesson.type === 'video' ? '📺 Video' : '📄 Article'} • {nextLesson.duration}</p>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => navigate(`/learning/${nextLesson.id}`)}>
              {nextLesson.isCompleted ? 'Take Quiz' : 'Start'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Search topics..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Types</option>
          <option value="video">Videos</option>
          <option value="article">Articles</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredModules.map(mod => (
          <div key={mod.id} className="card" style={{ display: 'flex', gap: 16, padding: 12, position: 'relative', opacity: mod.quizPassed ? 0.7 : 1 }} onClick={() => navigate(`/learning/${mod.id}`)}>
            <div style={{ position: 'relative' }}>
              <img src={mod.thumbnail} alt={mod.title} style={{ width: 100, height: 75, borderRadius: 8, objectFit: 'cover' }} />
              {mod.type === 'video' && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ▶
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16 }}>{mod.title}</h4>
                <p className="micro text-muted" style={{ margin: '4px 0 0 0' }}>{mod.duration} • {mod.rewardPoints + 15} max pts</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                <span className="micro" style={{ color: mod.quizPassed ? 'var(--color-success)' : mod.isCompleted ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                  {mod.quizPassed ? '✓ Mastered' : mod.isCompleted ? 'Pending Quiz' : 'Not Started'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredModules.length === 0 && (
          <p className="text-center text-muted">No lessons found.</p>
        )}
      </div>
    </motion.div>
  );
}
