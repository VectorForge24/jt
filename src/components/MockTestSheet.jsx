import { useState } from 'react';
import BottomSheet from './BottomSheet.jsx';

const TYPES = ['JEE Mains', 'JEE Advanced'];

export default function MockTestSheet({ isOpen, onClose, onSave, defaultDate }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState('JEE Mains');

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: `mock_${Date.now()}`,
      name: name.trim(),
      date,
      type,
      isCompleted: false,
      score: null,
    });
    setName('');
    onClose();
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Schedule Mock Test">
      <input
        type="text" placeholder="Mock name (e.g. AITS Full Test 3)" value={name}
        onChange={e => setName(e.target.value)}
        style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:14, padding:'14px 16px', color:'#fff', fontWeight:600, fontSize:15, marginBottom:16, outline:'none' }}
      />

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 12px', color:'#fff', fontWeight:600 }}/>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Exam Type</label>
        <div style={{ display:'flex', gap:8 }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{ flex:1, padding:'11px 0', borderRadius:12, fontSize:12, fontWeight:700,
                background: type===t ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${type===t?'#ef4444':'rgba(255,255,255,0.08)'}`,
                color: type===t ? '#f87171' : '#94a3b8' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave}
        style={{ width:'100%', padding:'14px 0', borderRadius:14, fontSize:15, fontWeight:700, color:'#fff',
          background:'linear-gradient(135deg,#ef4444,#dc2626)', border:'none' }}>
        Schedule Mock
      </button>
    </BottomSheet>
  );
}
