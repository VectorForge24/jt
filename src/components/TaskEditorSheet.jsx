import { useState, useEffect } from 'react';
import BottomSheet from './BottomSheet.jsx';
import { TASK_COLORS } from './DailyTaskList.jsx';
import { Trash2 } from 'lucide-react';

const TIME_OPTIONS = Array.from({ length:48 }, (_,i) => {
  const h = Math.floor(i/2).toString().padStart(2,'0');
  const m = i%2===0 ? '00' : '30';
  return `${h}:${m}`;
});

function extractTime(iso, def='08:00') { return iso?.includes('T') ? iso.split('T')[1].substring(0,5) : def; }
function extractDate(iso) { return iso?.includes('T') ? iso.split('T')[0] : iso; }

export default function TaskEditorSheet({ isOpen, onClose, onSave, onDelete, existingTask, defaultDate, chapters }) {
  const [taskName, setTaskName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [colorKey, setColorKey] = useState('blue');
  const [subject, setSubject] = useState('Physics');
  const [linkedChapter, setLinkedChapter] = useState('');
  const [date, setDate] = useState(defaultDate);

  useEffect(() => {
    if (!isOpen) return;
    if (existingTask) {
      setTaskName(existingTask.title || '');
      setStartTime(extractTime(existingTask.start, '08:00'));
      setEndTime(extractTime(existingTask.end, '10:00'));
      setColorKey(existingTask.extendedProps?.colorKey || existingTask.colorKey || 'blue');
      setSubject(existingTask.extendedProps?.subject || existingTask.subject || 'Physics');
      setLinkedChapter(existingTask.extendedProps?.linkedChapterTitle || existingTask.linkedChapterTitle || '');
      setDate(extractDate(existingTask.start));
    } else {
      setTaskName(''); setStartTime('08:00'); setEndTime('10:00');
      setColorKey('blue'); setSubject('Physics'); setLinkedChapter('');
      setDate(defaultDate);
    }
  }, [isOpen, existingTask, defaultDate]);

  const dateMonthKey = date ? `${date.slice(0,7)}` : '';
  const availChapters = (chapters||[]).filter(c => c.monthKey === dateMonthKey && c.subject === subject);

  function handleSave() {
    if (!taskName.trim()) return;
    onSave({
      id: existingTask?.id || String(Date.now()),
      title: taskName.trim(),
      start: `${date}T${startTime}:00`,
      end: `${date}T${endTime}:00`,
      colorKey, subject, linkedChapterTitle: linkedChapter, allDay:false,
      done: existingTask ? (existingTask.extendedProps?.done ?? existingTask.done ?? false) : false,
    });
    onClose();
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingTask ? 'Edit Task' : 'New Task'}>
      <input
        type="text" placeholder="Task name (e.g. Solve Irodov)" value={taskName}
        onChange={e => setTaskName(e.target.value)}
        style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:14, padding:'14px 16px', color:'#fff', fontWeight:600, fontSize:15, marginBottom:16, outline:'none' }}
      />

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 12px', color:'#fff', fontWeight:600 }}/>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <div style={{ flex:1 }}>
          <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Start</label>
          <select value={startTime} onChange={e => setStartTime(e.target.value)}
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 12px', color:'#fff', fontWeight:600 }}>
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex:1 }}>
          <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>End</label>
          <select value={endTime} onChange={e => setEndTime(e.target.value)}
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 12px', color:'#fff', fontWeight:600 }}>
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Subject</label>
        <div style={{ display:'flex', gap:8 }}>
          {['Physics','Chemistry','Mathematics'].map(s => (
            <button key={s} onClick={() => { setSubject(s); setLinkedChapter(''); }}
              style={{ flex:1, padding:'10px 0', borderRadius:12, fontSize:12, fontWeight:700,
                background: subject===s ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${subject===s?'#3b82f6':'rgba(255,255,255,0.08)'}`,
                color: subject===s ? '#60a5fa' : '#94a3b8' }}>
              {s==='Mathematics'?'Maths':s}
            </button>
          ))}
        </div>
      </div>

      {availChapters.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>
            Linked Chapter <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span>
          </label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {availChapters.map(ch => (
              <button key={ch.id} onClick={() => setLinkedChapter(linkedChapter===ch.title ? '' : ch.title)}
                style={{ padding:'7px 12px', borderRadius:99, fontSize:11, fontWeight:700,
                  background: linkedChapter===ch.title ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${linkedChapter===ch.title?'#6366f1':'rgba(255,255,255,0.08)'}`,
                  color: linkedChapter===ch.title ? '#818cf8' : '#94a3b8' }}>
                {ch.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Color</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {Object.entries(TASK_COLORS).map(([key,vals]) => (
            <button key={key} onClick={() => setColorKey(key)}
              style={{ width:30, height:30, borderRadius:'50%', background:vals.bg, border:`2px solid ${vals.border}`,
                outline: colorKey===key ? '2.5px solid #fff' : 'none', outlineOffset:2 }}/>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        {existingTask && (
          <button onClick={() => { onDelete(existingTask.id); onClose(); }}
            style={{ padding:'14px 18px', borderRadius:14, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)' }}>
            <Trash2 size={18} color="#f87171"/>
          </button>
        )}
        <button onClick={handleSave}
          style={{ flex:1, padding:'14px 0', borderRadius:14, fontSize:15, fontWeight:700, color:'#fff',
            background:'linear-gradient(135deg,#3b82f6,#2563eb)', border:'none' }}>
          {existingTask ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </BottomSheet>
  );
}
