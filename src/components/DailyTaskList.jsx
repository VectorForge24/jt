import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Pencil, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TASK_COLORS = {
  red:    { bg:'#ef4444', border:'#b91c1c' },
  orange: { bg:'#f97316', border:'#c2410c' },
  yellow: { bg:'#eab308', border:'#a16207' },
  green:  { bg:'#10b981', border:'#047857' },
  cyan:   { bg:'#06b6d4', border:'#0e7490' },
  blue:   { bg:'#3b82f6', border:'#1d4ed8' },
  indigo: { bg:'#6366f1', border:'#4338ca' },
  purple: { bg:'#a855f7', border:'#7e22ce' },
  pink:   { bg:'#ec4899', border:'#be185d' },
};

const SUBJ_COLOR = { Physics:'#3b82f6', Chemistry:'#10b981', Mathematics:'#a855f7' };

function extractTime(iso, def='00:00') { return iso?.includes('T') ? iso.split('T')[1].substring(0,5) : def; }
function getHrs(e) { return (new Date(e.end) - new Date(e.start)) / 3_600_000; }

function fire() {
  const end = Date.now() + 1500;
  const tick = () => {
    confetti({ particleCount:4, angle:60, spread:60, origin:{x:0,y:0.7}, gravity:0.9, colors:['#3b82f6','#10b981','#f59e0b'] });
    confetti({ particleCount:4, angle:120, spread:60, origin:{x:1,y:0.7}, gravity:0.9, colors:['#3b82f6','#f59e0b','#ec4899'] });
    if (Date.now() < end) requestAnimationFrame(tick);
  };
  tick();
}

function TaskCard({ task, onToggle, onEdit }) {
  const isDone = task.extendedProps?.done ?? task.done ?? false;
  const c = TASK_COLORS[task.colorKey || 'blue'] || TASK_COLORS.blue;
  const subj = task.extendedProps?.subject || task.subject || '';
  const hrs = getHrs(task);

  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, height:0 }}
      style={{
        position:'relative', overflow:'hidden', borderRadius:16,
        background: isDone ? 'rgba(148,163,184,0.06)' : `${c.bg}14`,
        border: `1px solid ${isDone?'rgba(148,163,184,0.1)':c.bg+'30'}`,
        opacity: isDone ? 0.6 : 1,
      }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:c.bg }}/>
      <button onClick={() => { if (!isDone) fire(); onToggle(task.id); }}
        style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:12, padding:'14px 14px 14px 18px', background:'none', border:'none', textAlign:'left' }}>
        <div style={{ marginTop:2, flexShrink:0 }}>
          {isDone ? <CheckSquare size={20} style={{color:c.bg}}/> : <Square size={20} color="#64748b"/>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:15, fontWeight:600, lineHeight:1.3, margin:0,
            color: isDone ? '#64748b' : '#f1f5f9', textDecoration: isDone?'line-through':'none' }}>{task.title}</p>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:600, color:'#94a3b8' }}>
              <Clock size={10}/>{extractTime(task.start)}–{extractTime(task.end)}
            </span>
            {hrs > 0 && <span style={{ fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:6, background:`${c.bg}22`, color:c.bg }}>{hrs.toFixed(1)}h</span>}
            {subj && <span style={{ fontSize:11, fontWeight:600, color: SUBJ_COLOR[subj]||'#94a3b8' }}>{subj==='Mathematics'?'Maths':subj}</span>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onEdit(task); }}
          style={{ padding:8, borderRadius:10, background:'rgba(255,255,255,0.06)', border:'none', flexShrink:0 }}>
          <Pencil size={14} color="#94a3b8"/>
        </button>
      </button>
    </motion.div>
  );
}

export default function DailyTaskList({ tasks, onToggle, onEdit, emptyAction }) {
  if (tasks.length === 0) return (
    <div style={{ textAlign:'center', padding:'28px 16px', borderRadius:16, border:'1px dashed rgba(148,163,184,0.25)' }}>
      <p style={{ fontSize:13, color:'#64748b', fontWeight:600, margin:0 }}>No tasks scheduled</p>
      {emptyAction && (
        <button onClick={emptyAction} style={{ marginTop:8, fontSize:12, fontWeight:700, color:'#3b82f6', background:'none', border:'none' }}>
          + Add a task
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <AnimatePresence mode="popLayout">
        {tasks.sort((a,b) => (a.start||'').localeCompare(b.start||'')).map(t => (
          <TaskCard key={t.id} task={t} onToggle={onToggle} onEdit={onEdit}/>
        ))}
      </AnimatePresence>
    </div>
  );
}
