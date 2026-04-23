import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { UserIcon, PlusIcon } from '../components/Icons';

const PUBLIC_CONTACTS = [
  { name: 'Police', phone: '100', icon: '👮', color: '#3B82F6' },
  { name: 'Ambulance', phone: '102', icon: '🚑', color: '#EF4444' },
  { name: 'Fire Force', phone: '101', icon: '🔥', color: '#F97316' },
  { name: 'Women Safety', phone: '1091', icon: '🛡️', color: '#8B5CF6' },
  { name: 'Disaster Mgmt', phone: '108', icon: '🆘', color: '#10B981' }
];

export default function Emergency() {
  const [personalContacts, setPersonalContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/sos/contacts');
      setPersonalContacts(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone) return setError('Name and phone are required');
    
    try {
      await api.post('/sos/contacts', { name: newName, phone: newPhone, relationship: newRelation });
      fetchContacts();
      setShowAddModal(false);
      setNewName(''); setNewPhone(''); setNewRelation(''); setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contact');
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('Remove this contact?')) return;
    try {
      await api.delete(`/sos/contacts/${id}`);
      fetchContacts();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="emergency-page">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ color: 'var(--color-error)' }}>🚨 Emergency Services</h1>
        <p className="text-secondary body-sm">One-tap access to official and personal help.</p>
      </header>

      {/* Public Services */}
      <section style={{ marginBottom: 40 }}>
        <h2 className="label" style={{ marginBottom: 16 }}>Official Help Lines</h2>
        <div className="public-grid">
          {PUBLIC_CONTACTS.map((c, i) => (
            <motion.a
              key={i}
              href={`tel:${c.phone}`}
              className="public-card"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ '--accent': c.color }}
            >
              <span className="p-icon">{c.icon}</span>
              <div className="p-info">
                <span className="p-name">{c.name}</span>
                <span className="p-num">{c.phone}</span>
              </div>
              <span className="p-call">📞</span>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Personal Contacts */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="label">Personal Contacts</h2>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowAddModal(true)}>
            <PlusIcon size={14} /> Add New
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted">Loading contacts...</div>
        ) : personalContacts.length === 0 ? (
          <div className="card text-center" style={{ padding: 40 }}>
            <p style={{ fontSize: 32 }}>👥</p>
            <p className="text-secondary" style={{ marginTop: 12 }}>No personal contacts added yet.</p>
            <p className="micro text-muted">Add people to be notified during SOS triggers.</p>
          </div>
        ) : (
          <div className="contact-list">
            {personalContacts.map((c, i) => (
              <motion.div
                key={c._id}
                className="contact-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="c-avatar">{c.name[0]}</div>
                <div className="c-info">
                  <p className="c-name">{c.name} <span className="c-rel">{c.relationship}</span></p>
                  <p className="c-phone">{c.phone}</p>
                </div>
                <div className="c-actions">
                  <a href={`tel:${c.phone}`} className="btn-icon">📞</a>
                  <button onClick={() => deleteContact(c._id)} className="btn-icon text-error">✕</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <motion.div
              className="modal-card"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>Add Emergency Contact</h3>
              <form onSubmit={handleAddContact} style={{ marginTop: 20 }}>
                <div className="form-group">
                  <label className="micro">Name</label>
                  <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name" />
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="micro">Phone Number</label>
                  <input className="input" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+91 00000 00000" />
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="micro">Relationship (Optional)</label>
                  <input className="input" value={newRelation} onChange={e => setNewRelation(e.target.value)} placeholder="Brother, Spouse, Friend..." />
                </div>
                {error && <p className="text-error micro" style={{ marginTop: 12 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button type="button" className="btn btn-secondary w-full" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-full">Save Contact</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .emergency-page { padding-bottom: 80px; }
        .public-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .public-card {
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 12px;
          position: relative; transition: all 0.3s;
        }
        .public-card:hover { border-color: var(--accent); background: rgba(var(--accent-rgb), 0.05); }
        .p-icon { font-size: 24px; }
        .p-info { display: flex; flex-direction: column; }
        .p-name { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
        .p-num { font-size: 13px; font-weight: 600; color: var(--accent); }
        .p-call { margin-left: auto; font-size: 14px; opacity: 0.4; }

        .contact-list { display: flex; flex-direction: column; gap: 10px; }
        .contact-card {
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: 16px; padding: 12px 16px; display: flex; align-items: center; gap: 14px;
        }
        .c-avatar {
          width: 40px; height: 40px; border-radius: 12px; background: var(--color-primary);
          color: #000; font-weight: 800; display: flex; align-items: center; justify-content: center;
        }
        .c-info { flex: 1; }
        .c-name { font-size: 15px; font-weight: 700; }
        .c-rel { font-size: 11px; font-weight: 600; background: var(--color-border); padding: 2px 6px; border-radius: 4px; margin-left: 6px; color: var(--color-text-secondary); }
        .c-phone { font-size: 13px; color: var(--color-text-secondary); margin-top: 2px; }
        .c-actions { display: flex; gap: 8px; }
        .btn-icon { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 20px; }
        .modal-card { background: var(--color-bg-base); border: 1px solid var(--color-border); border-radius: 24px; padding: 24px; width: 100%; max-width: 400px; box-shadow: var(--shadow-heavy); }

        @media (max-width: 480px) {
          .public-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
