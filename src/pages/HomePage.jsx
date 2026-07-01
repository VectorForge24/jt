import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import DailyTaskList from '../components/DailyTaskList.jsx';
import TaskEditorSheet from '../components/TaskEditorSheet.jsx';
import Heatmap from '../components/Heatmap.jsx';
import XPBar from '../components/XPBar.jsx';
import RankBadge from '../components/RankBadge.jsx';
import { XP_PER_SUBRANK } from '../engine/xpEngine.js';

function fmtYMD(d) { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }
function extractDate(iso) { return iso?.includes('T') ? iso.split('T')[0] : iso; }
function getHrs(e) { try { return (new Date(e.end) - new Date(e.start)) / 3_600_000; } catch { return 0; } }

export default function HomePage({ appState }) {
  const { events, setEvents, chapters, rank, subXP, rankingState, todayResult, userPosition } = appState;

  const [viewDate, setViewDate] = useState(new Date());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const viewDateStr = fmtYMD(viewDate);
  const todayStr    = fmtYMD(new Date());
  const isToday     = viewDateStr === todayStr;

  const viewTasks = useMemo(() =>
    events.filter(e => !e.allDay && extractDate(e.start) === viewDateStr)
          .sort((a,b) => (a.start||'').localeCompare(b.start||'')),
    [events, viewDateStr]
  );

  const totalHrs = viewTasks.reduce((s,e) => s + getHrs(e), 0);
  const doneHrs  = viewTasks.filter(e => e.extendedProps?.done ?? e.done).reduce((s,e) => s + getHrs(e), 0);
  const pct      = totalHrs > 0 ? Math.round((doneHrs / totalHrs) * 100) : 0;
  const doneCount= viewTasks.filter(e => e.extendedProps?.done ?? e.done).length;

  const tierEmoji = todayResult?.summary?.tier?.emoji || '';
  const tierName  = todayResult?.summary?.tier?.name  || '';

  const moveDay = (delta) => {
    const d = new Date(viewDate); d.setDate(d.getDate() + delta); setViewDate(d);
  };

  const dayLabel = isToday ? 'Today'
    : viewDate.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });

  const openNewTask = () => { setEditingTask(null); setEditorOpen(true); };
  const openEdit    = task => { setEditingTask(task); setEditorOpen(true); };

  const handleSaveTask = (taskData) => {
    setEvents(prev => {
      const exists = prev.find(e => e.id === taskData.id);
      return exists ? prev.map(e => e.id===taskData.id ? taskData : e) : [...prev, taskData];
    });
  };

  const handleDeleteTask = (id) => setEvents(prev => prev.filter(e => e.id !== id));

  const handleToggle = (id) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      const was = e.extendedProps?.done !== undefined ? e.extendedProps.done : e.done;
      return { ...e, done: !was };
    }));
  };

  const handleDayTap = (ds) => {
    setViewDate(new Date(ds + 'T12:00:00'));
  };

  // Ring calculation
  const ringR = 22, ringCirc = 2 * Math.PI * ringR;
  const ringColor = pct >= 90 ? '#10b981' : pct >= 55 ? '#3b82f6' : '#f59e0b';

  return (
    <div style={{ paddingBottom: 90 }}>

      {/* ── Date nav ───────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px 0' }}>
        <button onClick={() => moveDay(-1)} style={{ padding:8, borderRadius:12, background:'rgba(255,255,255,0.05)', border:'none' }}>
          <ChevronLeft size={18} color="#94a3b8"/>
        </button>
        <div style={{ flex:1, textAlign:'center' }}>
          <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#f1f5f9' }}>{dayLabel}</p>
          {!isToday && (
            <button onClick={() => setViewDate(new Date())} style={{ fontSize:11, fontWeight:700, color:'#3b82f6', background:'none', border:'none', marginTop:2 }}>
              ← Back to today
            </button>
          )}
        </div>
        <button onClick={() => moveDay(1)} style={{ padding:8, borderRadius:12, background:'rgba(255,255,255,0.05)', border:'none' }}>
          <ChevronRight size={18} color="#94a3b8"/>
        </button>
      </div>

      {/* ── Today stats strip ─────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, padding:'12px 16px', overflowX:'auto' }} className="hide-scrollbar">
        {/* Progress ring */}
        <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          background:'rgba(255,255,255,0.04)', borderRadius:16, padding:'12px 16px', minWidth:80, border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position:'relative', width:50, height:50 }}>
            <svg width="50" height="50" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="25" cy="25" r={ringR} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="4"/>
              <circle cx="25" cy="25" r={ringR} fill="none" stroke={ringColor} strokeWidth="4"
                strokeLinecap="round" strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc - (pct/100)*ringCirc}
                style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>{pct}%</span>
            </div>
          </div>
          <span style={{ fontSize:9, fontWeight:700, color:'#64748b', marginTop:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Done</span>
        </div>

        {/* Stats */}
        {[
          { label:'Tasks',  val:`${doneCount}/${viewTasks.length}` },
          { label:'Hours',  val:`${doneHrs.toFixed(1)}/${totalHrs.toFixed(1)}h` },
          { label:'XP Today', val: todayResult ? `${todayResult.xpDelta >= 0 ? '+' : ''}${todayResult.xpDelta}` : '—' },
        ].map(({ label, val }) => (
          <div key={label} style={{ flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center',
            background:'rgba(255,255,255,0.04)', borderRadius:16, padding:'12px 16px', minWidth:80, border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:17, fontWeight:800, color:'#f1f5f9', lineHeight:1 }}>{val}</div>
            <div style={{ fontSize:10, fontWeight:600, color:'#64748b', marginTop:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</div>
          </div>
        ))}

        {/* Tier badge */}
        {tierName && (
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
            background:'rgba(255,255,255,0.04)', borderRadius:16, padding:'12px 16px', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:22 }}>{tierEmoji}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'#64748b', marginTop:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{tierName}</div>
          </div>
        )}
      </div>

      {/* ── Rank card ─────────────────────────────────────────────────────── */}
      <div style={{ margin:'0 16px 14px', padding:'14px 16px', borderRadius:20,
        background:`${rank.bg}cc`, border:`1px solid ${rank.color}30`, boxShadow:`0 0 24px ${rank.glow}0f` }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
          <RankBadge rank={rank} size="md" animate/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:rank.color, marginBottom:2 }}>{rank.tier} {rank.sub}</div>
            <div style={{ fontSize:12, color:'#64748b' }}>
              {userPosition ? `#${userPosition} globally` : ''}
              {userPosition && todayResult ? ' · ' : ''}
              {todayResult ? `${(rankingState.totalXP||0).toLocaleString()} XP total` : ''}
            </div>
          </div>
        </div>
        <XPBar rank={rank} subXP={subXP}/>
      </div>

      {/* ── Heatmap ───────────────────────────────────────────────────────── */}
      <div style={{ margin:'0 16px 16px', padding:'14px 16px', borderRadius:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <Heatmap events={events} weeks={10} onDayTap={handleDayTap} rankColor={rank.color}/>
      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'#94a3b8', margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {isToday ? "Today's Tasks" : 'Tasks'}
          </h2>
          <button onClick={openNewTask}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:12, fontSize:12, fontWeight:700, color:'#fff', background:rank.color, border:'none' }}>
            <Plus size={14}/> Add
          </button>
        </div>

        <DailyTaskList tasks={viewTasks} onToggle={handleToggle} onEdit={openEdit} emptyAction={openNewTask}/>
      </div>

      {/* ── Floating add button (larger tap target) ────────────────────────── */}
      <button onClick={openNewTask}
        style={{ position:'fixed', bottom:96, right:20, width:52, height:52, borderRadius:'50%',
          background:rank.color, border:'none', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 4px 20px ${rank.glow}55`, zIndex:30 }}>
        <Plus size={24} color="#fff"/>
      </button>

      {/* ── Task editor sheet ─────────────────────────────────────────────── */}
      <TaskEditorSheet
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        existingTask={editingTask}
        defaultDate={viewDateStr}
        chapters={chapters}
      />
    </div>
  );
}
