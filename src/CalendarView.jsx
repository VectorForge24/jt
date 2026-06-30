import React, { useRef, useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import confetti from 'canvas-confetti';
import {
  Plus, X, Pencil, Trash2, Clock, Calendar as CalIcon,
  ChevronDown, CheckSquare, Square, Zap, Target,
  CheckCircle, ChevronLeft, ChevronRight, History,
} from 'lucide-react';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const NEXT_30_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i - 7);
  return fmtYMD(d);
});

const TASK_COLORS = {
  red:    { bg: '#ef4444', border: '#b91c1c', text: '#fff' },
  orange: { bg: '#f97316', border: '#c2410c', text: '#fff' },
  yellow: { bg: '#eab308', border: '#a16207', text: '#fff' },
  green:  { bg: '#10b981', border: '#047857', text: '#fff' },
  cyan:   { bg: '#06b6d4', border: '#0e7490', text: '#fff' },
  blue:   { bg: '#3b82f6', border: '#1d4ed8', text: '#fff' },
  indigo: { bg: '#6366f1', border: '#4338ca', text: '#fff' },
  purple: { bg: '#a855f7', border: '#7e22ce', text: '#fff' },
  pink:   { bg: '#ec4899', border: '#be185d', text: '#fff' },
};

const SUBJ_COLOR = { Physics: '#3b82f6', Chemistry: '#10b981', Mathematics: '#a855f7' };

function fmtYMD(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}
function extractTime(iso, def='00:00') { return iso?.includes('T') ? iso.split('T')[1].substring(0,5) : def; }
function extractDate(iso) { return iso?.includes('T') ? iso.split('T')[0] : iso; }
function getHrs(ev) { return (new Date(ev.end) - new Date(ev.start)) / 3_600_000; }

function getDateLabel(ds) {
  if (!ds) return 'Select Date';
  const d = new Date(ds), today = new Date();
  if (d.toDateString() === today.toDateString())
    return `Today, ${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  const tom = new Date(); tom.setDate(tom.getDate()+1);
  if (d.toDateString() === tom.toDateString())
    return `Tomorrow, ${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
}

function sprayConfetti() {
  const end = Date.now() + 2000;
  const fire = () => {
    confetti({ particleCount:5, angle:60,  spread:70, origin:{x:0,y:0.7}, gravity:0.8, ticks:150, colors:['#3b82f6','#10b981','#f59e0b'] });
    confetti({ particleCount:5, angle:120, spread:70, origin:{x:1,y:0.7}, gravity:0.8, ticks:150, colors:['#3b82f6','#f59e0b','#ec4899'] });
    if (Date.now() < end) requestAnimationFrame(fire);
  };
  fire();
}

/* ── Heatmap ─────────────────────────────────────────────────────────────── */
function StudyHeatmap({ events, onDayClick }) {
  const today = new Date();
  const todayStr = fmtYMD(today);
  const WEEKS = 10;
  const cells = [];
  for (let i = WEEKS*7-1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate()-i);
    const ds = fmtYMD(d);
    const dayEvs = events.filter(e => extractDate(e.start)===ds && !e.allDay);
    const total  = dayEvs.reduce((s,e) => s+getHrs(e), 0);
    const done   = dayEvs.filter(e => e.done||e.extendedProps?.done).reduce((s,e) => s+getHrs(e), 0);
    const pct    = total > 0 ? done/total : -1;
    cells.push({ ds, pct, total, done, dow:(d.getDay()+6)%7 });
  }
  const cols=[]; let col=[];
  const firstDow = cells[0].dow;
  for (let p=0;p<firstDow;p++) col.push(null);
  for (const c of cells) { col.push(c); if(col.length===7){cols.push(col);col=[];} }
  if (col.length>0) { while(col.length<7)col.push(null); cols.push(col); }

  function cellColor(pct) {
    if (pct<0) return 'rgba(148,163,184,0.1)';
    if (pct>=0.90) return '#10b981';
    if (pct>=0.75) return '#34d399';
    if (pct>=0.55) return '#60a5fa';
    if (pct>=0.35) return '#f59e0b';
    if (pct>=0.15) return '#f97316';
    return '#f43f5e';
  }
  const LABELS=['M','','W','','F','','S'], CW=12, GAP=3;
  return (
    <div className="mb-4 select-none">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Activity</span>
        <div className="flex items-center gap-2 text-[8px] font-semibold text-slate-400">
          {[['#10b981','Elite'],['#60a5fa','Good'],['#f43f5e','Low']].map(([c,l])=>(
            <div key={l} className="flex items-center gap-1">
              <span style={{width:8,height:8,borderRadius:2,background:c,display:'inline-block'}}/>
              {l}
            </div>
          ))}
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <div style={{display:'flex',gap:GAP}}>
          <div style={{display:'flex',flexDirection:'column',gap:GAP,marginRight:2}}>
            {LABELS.map((l,i)=>(
              <div key={i} style={{height:CW,width:9,fontSize:7,color:'#64748b',lineHeight:`${CW}px`,textAlign:'right',fontFamily:'monospace'}}>{l}</div>
            ))}
          </div>
          {cols.map((col,ci)=>(
            <div key={ci} style={{display:'flex',flexDirection:'column',gap:GAP}}>
              {col.map((cell,ri)=>(
                <div key={ri}
                  title={cell?(cell.pct>=0?`${cell.ds}: ${cell.done.toFixed(1)}h/${cell.total.toFixed(1)}h (${Math.round(cell.pct*100)}%)`:`${cell.ds}: no tasks`):''}
                  onClick={()=>cell&&onDayClick(cell.ds)}
                  style={{
                    width:CW,height:CW,borderRadius:2,flexShrink:0,
                    background:cell?cellColor(cell.pct):'transparent',
                    cursor:cell?'pointer':'default',
                    border:cell?.ds===todayStr?'1.5px solid rgba(255,255,255,0.6)':'none',
                    transition:'transform 0.1s',boxSizing:'border-box',
                  }}
                  onMouseEnter={e=>{if(cell)e.target.style.transform='scale(1.4)';}}
                  onMouseLeave={e=>{e.target.style.transform='scale(1)';}}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Progress ring ────────────────────────────────────────────────────────── */
function Ring({ pct, size=50, stroke=4, color='#3b82f6' }) {
  const r = (size-stroke)/2, circ = 2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} r={r} cx={size/2} cy={size/2}/>
      <circle fill="none" stroke={color} strokeWidth={stroke} r={r} cx={size/2} cy={size/2}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ - (Math.min(100,pct)/100)*circ}
        style={{transition:'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)'}}/>
    </svg>
  );
}

/* ── Task card ────────────────────────────────────────────────────────────── */
function TaskCard({ task, onToggle, onEdit }) {
  const isDone = task.extendedProps?.done !== undefined ? task.extendedProps.done : task.done;
  const c = TASK_COLORS[task.colorKey||'blue'] || TASK_COLORS.blue;
  const subj = task.extendedProps?.subject || task.subject || '';
  const hrs = getHrs(task);
  return (
    <div className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: isDone ? 'rgba(148,163,184,0.06)' : `${c.bg}15`,
        border: `1px solid ${isDone?'rgba(148,163,184,0.1)':c.bg+'30'}`,
        opacity: isDone ? 0.55 : 1,
      }}
      onClick={()=>onToggle(task.id)}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:c.bg,borderRadius:'99px 0 0 99px'}}/>
      <div className="flex items-start gap-2 p-2.5 pl-4">
        <div className="mt-0.5 flex-shrink-0">
          {isDone
            ? <CheckSquare size={14} style={{color:c.bg}}/>
            : <Square size={14} className="text-slate-400 group-hover:text-blue-400 transition-colors"/>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold leading-tight ${isDone?'line-through text-slate-400':'text-slate-800 dark:text-white'}`}>{task.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
              {extractTime(task.start)}–{extractTime(task.end)}
            </span>
            {hrs>0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{background:`${c.bg}22`,color:c.bg}}>{hrs.toFixed(1)}h</span>}
            {subj && <span className="text-[9px] font-semibold" style={{color:SUBJ_COLOR[subj]||'#64748b'}}>{subj==='Mathematics'?'Math':subj}</span>}
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 flex-shrink-0"
          onClick={e=>{e.stopPropagation();onEdit(task);}}>
          <Pencil size={10} className="text-slate-400"/>
        </button>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function CalendarView({ themeToggle, timerIsland, syncTrigger }) {
  const calendarRef = useRef(null);
  const [currentView,       setCurrentView]       = useState('dayGridMonth');
  const [calendarTitle,     setCalendarTitle]     = useState('');
  const [currentRenderDate, setCurrentRenderDate] = useState(new Date());
  const [fullSyllabus,      setFullSyllabus]      = useState(() => JSON.parse(localStorage.getItem('tracker-syllabus')||'[]'));
  const [chapters,          setChapters]          = useState(() => JSON.parse(localStorage.getItem('tracker-chapters')||'[]'));
  const [events,            setEvents]            = useState(() => JSON.parse(localStorage.getItem('tracker-events')||'[]'));
  const [mocks,             setMocks]             = useState(() => JSON.parse(localStorage.getItem('tracker-mocks')||'[]'));
  const [isMockModalOpen,   setIsMockModalOpen]   = useState(false);
  const [isMockHistoryOpen, setIsMockHistoryOpen] = useState(false);
  const [mockForm, setMockForm] = useState({name:'',date:fmtYMD(new Date()),start:'09:00',end:'12:00',type:'JEE Mains',selectedChapters:[],isCompleted:false,score:null});
  const [mockSubjectTab,    setMockSubjectTab]    = useState(null);
  const [mockEditId,        setMockEditId]        = useState(null);
  const [openDropdown,      setOpenDropdown]      = useState(null);
  const [isDateDropdownOpen,setIsDateDropdownOpen]= useState(false);
  const [isScoreModalOpen,  setIsScoreModalOpen]  = useState(false);
  const [activeMockForScore,setActiveMockForScore]= useState(null);
  const [tempScore,         setTempScore]         = useState('');
  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [editingId,         setEditingId]         = useState(null);
  const [selectedDate,      setSelectedDate]      = useState('');
  const [taskName,          setTaskName]          = useState('');
  const [startTime,         setStartTime]         = useState('08:00');
  const [endTime,           setEndTime]           = useState('10:00');
  const [taskColorKey,      setTaskColorKey]      = useState('blue');
  const [subject,           setSubject]           = useState('Physics');
  const [linkedChapterTitle,setLinkedChapterTitle]= useState('');
  const [dailyModal, setDailyModal] = useState({isOpen:false,dateStr:'',tasks:[],dayMocks:[]});
  const [isChapterModalOpen,setIsChapterModalOpen]= useState(false);
  const [pendingSelection,  setPendingSelection]  = useState([]);

  useEffect(() => {
    setFullSyllabus(JSON.parse(localStorage.getItem('tracker-syllabus')||'[]'));
    setChapters(JSON.parse(localStorage.getItem('tracker-chapters')||'[]'));
    setEvents(JSON.parse(localStorage.getItem('tracker-events')||'[]'));
  }, []);

  useEffect(() => { localStorage.setItem('tracker-chapters',JSON.stringify(chapters)); syncTrigger?.(); }, [chapters]);
  useEffect(() => { localStorage.setItem('tracker-events',JSON.stringify(events));    syncTrigger?.(); }, [events]);
  useEffect(() => { localStorage.setItem('tracker-mocks',JSON.stringify(mocks));      syncTrigger?.(); }, [mocks]);

  useEffect(() => {
    const update = () => document.documentElement.style.setProperty('--current-time',
      `"${new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit'})}"`);
    update(); const iv = setInterval(update,60000); return ()=>clearInterval(iv);
  },[]);

  const todayStr             = fmtYMD(new Date());
  const currentMonthKey      = `${currentRenderDate.getFullYear()}-${String(currentRenderDate.getMonth()+1).padStart(2,'0')}`;
  const currentMonthChapters = chapters.filter(c=>c.monthKey===currentMonthKey);

  const todaysTasks = useMemo(()=>
    events.filter(e=>extractDate(e.start)===todayStr&&!e.allDay)
          .sort((a,b)=>(a.start||'').localeCompare(b.start||'')),
    [events,todayStr]);

  const todayTotal     = todaysTasks.reduce((s,e)=>s+getHrs(e),0);
  const todayDone      = todaysTasks.filter(e=>e.done||e.extendedProps?.done).reduce((s,e)=>s+getHrs(e),0);
  const todayPct       = todayTotal>0 ? Math.round((todayDone/todayTotal)*100) : 0;
  const todayDoneCount = todaysTasks.filter(e=>e.done||e.extendedProps?.done).length;
  const ringColor      = todayPct>=90?'#10b981':todayPct>=55?'#3b82f6':'#f59e0b';

  const changeView = v => { calendarRef.current.getApi().changeView(v); setCurrentView(v); };
  const getScrollTime = () => { const d=new Date(); d.setHours(Math.max(0,d.getHours()-3)); return `${String(d.getHours()).padStart(2,'0')}:00:00`; };

  const openAddModal = (dateStr, existingTask=null) => {
    setChapters(JSON.parse(localStorage.getItem('tracker-chapters')||'[]'));
    setFullSyllabus(JSON.parse(localStorage.getItem('tracker-syllabus')||'[]'));
    if (existingTask) {
      setEditingId(existingTask.id); setTaskName(existingTask.title||'');
      setStartTime(extractTime(existingTask.start,'08:00')); setEndTime(extractTime(existingTask.end,'10:00'));
      setTaskColorKey(existingTask.extendedProps?.colorKey||existingTask.colorKey||'blue');
      setSubject(existingTask.extendedProps?.subject||existingTask.subject||'Physics');
      setLinkedChapterTitle(existingTask.extendedProps?.linkedChapterTitle||existingTask.linkedChapterTitle||'');
      setSelectedDate(extractDate(existingTask.start));
    } else {
      setEditingId(null); setSelectedDate(extractDate(dateStr)); setTaskName('');
      setStartTime('08:00'); setEndTime('10:00'); setTaskColorKey('blue'); setSubject('Physics'); setLinkedChapterTitle('');
    }
    setDailyModal(p=>({...p,isOpen:false})); setIsModalOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskName) return;
    const existing = events.find(e=>e.id===editingId);
    const newEv = { id:editingId||String(Date.now()), title:taskName, start:`${selectedDate}T${startTime}:00`, end:`${selectedDate}T${endTime}:00`,
      colorKey:taskColorKey, subject, linkedChapterTitle, allDay:false,
      done:existing?(existing.extendedProps?.done??existing.done??false):false };
    setEvents(editingId?events.map(e=>e.id===editingId?newEv:e):[...events,newEv]);
    setIsModalOpen(false);
  };

  const deleteTask   = id => { setEvents(events.filter(e=>e.id!==id)); setDailyModal(p=>({...p,tasks:p.tasks.filter(t=>t.id!==id)})); };
  const deleteMock   = id => { setMocks(mocks.filter(m=>m.id!==id)); setDailyModal(p=>({...p,dayMocks:p.dayMocks.filter(m=>m.id!==id)})); };
  const toggleTaskDone = id => setEvents(events.map(e=>{if(e.id!==id)return e;const was=e.extendedProps?.done!==undefined?e.extendedProps.done:e.done;if(!was)sprayConfetti();return{...e,done:!was};}));

  const triggerDailyModal = ds => {
    const safe=extractDate(ds);
    setDailyModal({isOpen:true,dateStr:safe,tasks:events.filter(e=>extractDate(e.start)===safe),dayMocks:mocks.filter(m=>m.date===safe)});
  };

  const openMockModal = (existing=null) => {
    setOpenDropdown(null);
    if(existing){setMockEditId(existing.id);setMockForm({...existing,selectedChapters:existing.selectedChapters||[]});}
    else{setMockEditId(null);setMockForm({name:'',date:fmtYMD(new Date()),start:'09:00',end:'12:00',type:'JEE Mains',selectedChapters:[],isCompleted:false,score:null});}
    setDailyModal(p=>({...p,isOpen:false})); setIsMockModalOpen(true);
  };
  const openScoreModal = mock => { setActiveMockForScore(mock); setTempScore(mock.score?String(mock.score):''); setIsScoreModalOpen(true); };
  const saveMockTest = () => {
    if(!mockForm.name||!mockForm.date||!mockForm.start||!mockForm.end||!mockForm.type){alert('⚠️ Fill all required fields.');return;}
    if(mockEditId)setMocks(mocks.map(m=>m.id===mockEditId?{...mockForm}:m));
    else setMocks([...mocks,{id:String(Date.now()),...mockForm,isCompleted:false,score:null}]);
    setIsMockModalOpen(false);
  };
  const handleMockScoreSubmit = () => {
    if(!tempScore||isNaN(tempScore))return;
    setMocks(mocks.map(m=>m.id===activeMockForScore.id?{...m,isCompleted:true,score:Number(tempScore)}:m));
    setIsScoreModalOpen(false); setTempScore(''); sprayConfetti();
  };

  const getMockBg = m => {
    if(!m.isCompleted)return 'bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/5';
    const s=Number(m.score);
    if(m.type==='JEE Mains'){if(s<=110)return'bg-red-500/20 border-red-500/50 text-red-500';if(s<=190)return'bg-yellow-500/20 border-yellow-500/50 text-yellow-500';return'bg-green-500/20 border-green-500/50 text-green-500';}
    else{if(s<=120)return'bg-red-500/20 border-red-500/50 text-red-500';if(s<=220)return'bg-yellow-500/20 border-yellow-500/50 text-yellow-500';return'bg-green-500/20 border-green-500/50 text-green-500';}
  };
  const getScorePill = m => {
    const s=Number(m.score);
    if(m.type==='JEE Mains'){if(s<=110)return'bg-red-500 text-white';if(s<=190)return'bg-yellow-500 text-white';return'bg-green-500 text-white';}
    else{if(s<=120)return'bg-red-500 text-white';if(s<=220)return'bg-yellow-500 text-white';return'bg-green-500 text-white';}
  };

  const openChapterModal = () => {
    setFullSyllabus(JSON.parse(localStorage.getItem('tracker-syllabus')||'[]'));
    setPendingSelection(currentMonthChapters.map(c=>c.chapterId));
    setIsChapterModalOpen(true);
  };
  const handleSaveMonthlyChapters = () => {
    let nc=chapters.filter(c=>c.monthKey!==currentMonthKey||pendingSelection.includes(c.chapterId));
    const existIds=nc.filter(c=>c.monthKey===currentMonthKey).map(c=>c.chapterId);
    const adds=pendingSelection.filter(id=>!existIds.includes(id)).map(id=>{const ch=fullSyllabus.find(s=>s.id===id);return{id:`mc_${Date.now()}_${Math.random()}`,chapterId:ch.id,title:ch.title,subject:ch.subject,done:false,monthKey:currentMonthKey};});
    setChapters([...nc,...adds]); setIsChapterModalOpen(false);
  };
  const toggleChapterDone = id => {
    setChapters(chapters.map(c=>{
      if(c.id!==id)return c;
      const nd=!c.done; if(nd)sprayConfetti();
      const ufs=fullSyllabus.map(s=>{if(s.id!==c.chapterId)return s;const mats=JSON.parse(localStorage.getItem('tracker-materials'))||{};const sm=mats[s.subject]||[];const np={...(s.progress||{})};if(nd)sm.forEach(m=>np[m]=true);return{...s,progress:np};});
      setFullSyllabus(ufs);localStorage.setItem('tracker-syllabus',JSON.stringify(ufs));syncTrigger?.();
      return{...c,done:nd};
    }));
  };

  const taskDateObj  = selectedDate?new Date(selectedDate):currentRenderDate;
  const taskMonthKey = `${taskDateObj.getFullYear()}-${String(taskDateObj.getMonth()+1).padStart(2,'0')}`;
  const availChapters= chapters.filter(c=>c.monthKey===taskMonthKey&&c.subject===subject);

  const DD = ({ value, options, onChange, label, typeKey }) => (
    <div className="relative flex-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{label} *</label>
      <div className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl px-3 py-2.5 font-bold text-slate-900 dark:text-white cursor-pointer flex justify-between items-center text-sm"
        onClick={()=>setOpenDropdown(openDropdown===typeKey?null:typeKey)}>
        {typeKey==='date'?getDateLabel(value):value}<ChevronDown size={13} className="text-blue-500"/>
      </div>
      {openDropdown===typeKey&&(
        <div className="absolute top-full left-0 mt-1 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-200 dark:border-blue-800 rounded-xl shadow-2xl z-[300] max-h-48 overflow-y-auto hide-scrollbar">
          {options.map(opt=>(
            <div key={opt} onClick={()=>{onChange(opt);setOpenDropdown(null);}}
              className="px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0">
              {typeKey==='date'?getDateLabel(opt):opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* render helpers */
  const renderEventContent = info => {
    const k=info.event.extendedProps?.colorKey||'blue', isDone=info.event.extendedProps?.done||false;
    const c=TASK_COLORS[k]||TASK_COLORS.blue;
    if (currentView==='dayGridMonth') return (
      <div className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded ${isDone?'opacity-40':''}`}
        style={{backgroundColor:`${c.bg}e0`,borderLeft:`3px solid ${c.border}`,color:c.text,fontSize:11,fontWeight:700,lineHeight:1.35,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        {isDone&&<span style={{fontSize:9}}>✓</span>}
        <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{info.event.title}</span>
      </div>
    );
    const s=info.event.start?.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true});
    const e=info.event.end?.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true});
    return (
      <div className={`relative z-20 w-full h-full flex flex-col justify-start p-2 overflow-hidden ${isDone?'saturate-50 brightness-75':''}`}
        style={{backgroundColor:c.bg,borderLeft:`4px solid ${c.border}`,borderRadius:10,color:c.text}}>
        <div className={`text-sm font-black leading-tight mb-1 ${isDone?'line-through opacity-70':''}`}>{info.event.title}</div>
        <div className="flex items-center gap-1 opacity-80" style={{fontSize:10,fontWeight:700}}><Clock size={9}/>{s}–{e}</div>
      </div>
    );
  };

  const renderMonthCell = arg => {
    const ds=fmtYMD(arg.date), dayMocks=mocks.filter(m=>m.date===ds);
    const isToday=ds===todayStr;
    const dayEvs=events.filter(e=>extractDate(e.start)===ds&&!e.allDay);
    const allDone=dayEvs.length>0&&dayEvs.every(e=>e.done||e.extendedProps?.done);
    const allMocksDone=dayMocks.length>0&&dayMocks.every(m=>m.isCompleted);
    return (
      <div className="flex justify-between items-start w-full h-full p-0.5 cursor-pointer group" onClick={()=>triggerDailyModal(ds)}>
        <div className="flex flex-col items-start pt-1 pl-1 gap-1">
          {dayMocks.length>0&&<span className="relative flex h-2 w-2"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${allMocksDone?'bg-green-400':'bg-red-400'}`}/><span className={`relative inline-flex rounded-full h-2 w-2 ${allMocksDone?'bg-green-500':'bg-red-500'}`}/></span>}
          {allDone&&<CheckCircle size={9} className="text-green-400"/>}
        </div>
        <div className="flex items-center gap-0.5 pt-0.5 pr-0.5">
          <button type="button" onClick={e=>{e.stopPropagation();openAddModal(ds);}}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-white/30 dark:bg-white/10 border border-white/20 rounded-full text-slate-600 dark:text-slate-300">
            <Plus size={10} className="pointer-events-none"/>
          </button>
          <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-colors text-[10px] font-bold
            ${isToday?'bg-blue-600 text-white':'text-slate-700 dark:text-slate-300 group-hover:bg-white/20 dark:group-hover:bg-white/10'}`}>
            {arg.dayNumberText.replace('日','')}
          </div>
        </div>
      </div>
    );
  };

  const renderHeaderContent = arg => {
    if (currentView==='dayGridMonth')
      return <div className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest py-2">{arg.text.replace(/[0-9]/g,'')}</div>;
    const date=arg.date.getDate(), day=arg.date.toLocaleDateString('en-US',{weekday:'short'});
    const isTd=fmtYMD(arg.date)===todayStr;
    return (
      <div className="flex flex-col items-center py-2">
        <div className={`w-7 h-7 flex items-center justify-center rounded-full mb-0.5 ${isTd?'bg-blue-600 text-white':'text-slate-800 dark:text-white'}`}>
          <span className="text-base font-black">{date}</span>
        </div>
        <span className={`text-[9px] uppercase font-bold tracking-wider ${isTd?'text-blue-500':'text-slate-400 dark:text-slate-600'}`}>{day}</span>
      </div>
    );
  };

  /* ── JSX ──────────────────────────────────────────────────────────────── */
  return (
    <>
    <div className="glass-card w-full flex flex-col relative rounded-[28px] shadow-2xl mb-2 mr-2 overflow-hidden" style={{minHeight:'calc(100vh - 80px)'}}>

      {isDateDropdownOpen&&<div className="fixed inset-0 z-[190]" onClick={()=>setIsDateDropdownOpen(false)}/>}

      {/* TOP BAR */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-white/15 dark:border-white/5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          {/* Title dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 px-3 py-1.5 rounded-full bg-white/35 dark:bg-white/6 border border-white/25 dark:border-white/8"
              onClick={()=>setIsDateDropdownOpen(!isDateDropdownOpen)}>
              <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight select-none">{calendarTitle}</h2>
              <ChevronDown size={14} className="text-slate-500"/>
            </div>
            {isDateDropdownOpen&&(
              <div className="absolute top-full left-0 mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[200] p-1.5 max-h-[300px] overflow-y-auto hide-scrollbar">
                {currentView==='dayGridMonth'
                  ?['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>(
                    <button key={m} onClick={()=>{calendarRef.current.getApi().gotoDate(new Date(currentRenderDate.getFullYear(),i,1));setIsDateDropdownOpen(false);}}
                      className={`flex w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${i===currentRenderDate.getMonth()?'bg-blue-500/15 text-blue-600 dark:text-blue-400':'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      {m} {currentRenderDate.getFullYear()}
                    </button>))
                  :<p className="p-4 text-sm text-slate-500 text-center font-semibold">Use arrows to navigate</p>}
              </div>
            )}
          </div>
          {/* Nav */}
          <div className="flex gap-0.5 bg-white/25 dark:bg-white/5 rounded-full p-0.5 border border-white/20 dark:border-white/5">
            <button onClick={()=>calendarRef.current.getApi().prev()} className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors text-sm font-bold">‹</button>
            <button onClick={()=>calendarRef.current.getApi().today()} className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 rounded-full transition-colors">Today</button>
            <button onClick={()=>calendarRef.current.getApi().next()} className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors text-sm font-bold">›</button>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex w-[220px] bg-slate-200/40 dark:bg-black/25 p-0.5 rounded-full border border-white/15 dark:border-white/5">
            <div className="absolute top-0.5 bottom-0.5 rounded-full bg-white/90 dark:bg-white/20 shadow border border-white/50 dark:border-white/15 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{width:'calc(33.33% - 2px)',transform:`translateX(${['dayGridMonth','timeGridWeek','timeGridDay'].indexOf(currentView)*100}%)`}}/>
            {['Month','Week','Day'].map((v,i)=>{
              const api=['dayGridMonth','timeGridWeek','timeGridDay'][i];
              return <button key={v} onClick={()=>changeView(api)}
                className={`relative flex-1 py-1.5 text-xs font-bold z-10 transition-all ${currentView===api?'text-slate-900 dark:text-white font-black':'text-slate-500/70 dark:text-slate-400/60'}`}>
                {v}
              </button>;
            })}
          </div>
          {timerIsland}
          {themeToggle}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="hidden md:flex w-[272px] shrink-0 border-r border-white/12 dark:border-white/5 flex-col overflow-y-auto hide-scrollbar px-4 py-4 gap-0">

          {/* Today stats */}
          <div className="mb-4 p-3 rounded-2xl bg-white/25 dark:bg-white/4 border border-white/20 dark:border-white/5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Today</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                  {new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <Ring pct={todayPct} color={ringColor}/>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-slate-800 dark:text-white">{todayPct}%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 text-center">
              {[{v:todaysTasks.length,l:'Tasks'},{v:todayDoneCount,l:'Done'},{v:`${todayDone.toFixed(1)}h`,l:'Hours'}].map(({v,l})=>(
                <div key={l} className="flex-1 py-1.5 rounded-xl bg-white/20 dark:bg-white/5">
                  <div className="text-sm font-black text-slate-800 dark:text-white">{v}</div>
                  <div className="text-[8px] font-semibold text-slate-500 uppercase tracking-wide">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <StudyHeatmap events={events} onDayClick={triggerDailyModal}/>

          <div className="h-px bg-slate-200/40 dark:bg-white/5 mb-4"/>

          {/* Today's tasks */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-yellow-500 fill-yellow-500"/>
                <span className="text-xs font-bold text-slate-700 dark:text-white">Today's Tasks</span>
              </div>
              <button type="button" onClick={()=>openAddModal(todayStr)}
                className="p-1 rounded-full bg-white/40 dark:bg-white/8 text-slate-500 hover:text-blue-500 border border-white/20 dark:border-white/6 transition-all hover:scale-110">
                <Plus size={11} className="pointer-events-none"/>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {todaysTasks.length===0
                ?<div className="py-3 text-center rounded-xl border border-dashed border-slate-200/60 dark:border-white/8">
                  <p className="text-[10px] text-slate-400 font-semibold">No tasks today</p>
                  <button onClick={()=>openAddModal(todayStr)} className="mt-1 text-[10px] font-bold text-blue-500">+ Add →</button>
                </div>
                :todaysTasks.map(t=><TaskCard key={t.id} task={t} onToggle={toggleTaskDone} onEdit={t=>openAddModal(t.start,t)}/>)
              }
            </div>
          </div>

          <div className="h-px bg-slate-200/40 dark:bg-white/5 mb-4"/>

          {/* Chapters */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-blue-500 fill-blue-500"/>
                <span className="text-xs font-bold text-slate-700 dark:text-white">Chapters Covered</span>
              </div>
              <button type="button" onClick={openChapterModal}
                className="p-1 rounded-full bg-white/40 dark:bg-white/8 text-slate-500 hover:text-blue-500 border border-white/20 dark:border-white/6 transition-all hover:scale-110">
                <Plus size={11} className="pointer-events-none"/>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {currentMonthChapters.length===0
                ?<span className="text-[10px] text-slate-400 font-medium">No chapters mapped this month.</span>
                :currentMonthChapters.map(chap=>{
                  const sc=SUBJ_COLOR[chap.subject]||'#64748b';
                  return (
                    <div key={chap.id} onClick={()=>toggleChapterDone(chap.id)}
                      className={`flex items-start gap-2 cursor-pointer group p-2 rounded-xl border transition-all ${chap.done?'opacity-45 bg-slate-100/30 dark:bg-white/2 border-transparent':'bg-white/20 dark:bg-white/4 border-white/15 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/7'}`}>
                      <div className="mt-0.5 flex-shrink-0">
                        {chap.done?<CheckSquare size={13} style={{color:sc}}/>:<Square size={13} className="text-slate-400 group-hover:text-blue-400 transition-colors"/>}
                      </div>
                      <div>
                        <p className={`text-[11px] font-semibold leading-tight ${chap.done?'line-through text-slate-400':'text-slate-800 dark:text-white'}`}>{chap.title}</p>
                        <span className="text-[9px] font-semibold mt-0.5 inline-block" style={{color:sc}}>{chap.subject}</span>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          <div className="h-px bg-slate-200/40 dark:bg-white/5 mb-4"/>

          {/* Mocks */}
          <div className="pb-6">
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-1.5">
                <Target size={12} className="text-red-500 fill-red-500"/>
                <span className="text-xs font-bold text-slate-700 dark:text-white">Mock Tests</span>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={()=>setIsMockHistoryOpen(true)}
                  className="p-1 rounded-full bg-white/40 dark:bg-white/8 text-slate-500 hover:text-red-400 border border-white/20 dark:border-white/6 transition-all hover:scale-110">
                  <History size={11}/>
                </button>
                <button type="button" onClick={()=>openMockModal()}
                  className="p-1 rounded-full bg-white/40 dark:bg-white/8 text-slate-500 hover:text-red-400 border border-white/20 dark:border-white/6 transition-all hover:scale-110">
                  <Plus size={11}/>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {mocks.filter(m=>m.date?.startsWith(currentMonthKey)).length===0
                ?<span className="text-[10px] text-slate-400 font-medium">No mocks this month.</span>
                :mocks.filter(m=>m.date?.startsWith(currentMonthKey)).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(m=>(
                  <div key={m.id} className={`p-2.5 rounded-xl border shadow-sm overflow-hidden ${getMockBg(m)}`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        {m.isCompleted
                          ?<div className="relative flex items-center justify-center w-3.5 h-3.5"><div className="absolute inset-0 bg-green-300 rounded-full animate-ping opacity-50"/><CheckCircle size={12} className="text-white relative z-10"/></div>
                          :<button onClick={e=>{e.stopPropagation();openScoreModal(m);}} className="group relative w-3.5 h-3.5 flex items-center justify-center cursor-pointer z-50">
                            <div className="w-3 h-3 rounded border-2 border-slate-400 dark:border-slate-300 group-hover:border-red-400 transition-colors"/>
                            <div className="absolute top-[-1px] right-[-1px] w-1.5 h-1.5 bg-red-500 rounded-full animate-ping opacity-70"/>
                            <div className="absolute top-[-1px] right-[-1px] w-1.5 h-1.5 bg-red-500 rounded-full z-20"/>
                          </button>
                        }
                        <span className="text-[11px] font-black text-white">{m.name}</span>
                      </div>
                      {m.isCompleted&&<span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getScorePill(m)}`}>{m.score}/{m.type==='JEE Mains'?300:360}</span>}
                    </div>
                    <div className="text-[9px] font-semibold text-white/60 pl-5">{m.date} · {m.type}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="custom-calendar relative p-2.5 h-full flex-1 flex flex-col z-0 overflow-hidden w-full">
          <style>{`
            .custom-calendar .fc { --fc-border-color: rgba(148,163,184,0.13); height:100%; width:100%; }
            .dark .custom-calendar .fc { --fc-border-color: rgba(51,65,85,0.4); }
            .custom-calendar .fc-col-header-cell { padding: 0; }
            .custom-calendar .fc-daygrid-day-number { width:100%; padding:0; }
            .custom-calendar .fc-daygrid-day-top { display:flex !important; flex-direction:row; justify-content:space-between; width:100%; }
            .custom-calendar .fc-daygrid-event-harness { margin-top:2px; }
            .custom-calendar .fc-event { background:transparent;border:none;padding:0;margin-bottom:2px!important; }
            .custom-calendar .fc-daygrid-day-events { padding:0 3px 3px!important; }
            .fc-scrollgrid-sync-table { height:100%!important; }
            .fc-view-harness { flex-grow:1; overflow:hidden; }
            .custom-calendar .fc-timegrid-now-indicator-arrow { display:none; }
            .custom-calendar .fc-timegrid-now-indicator-line { border-color:#f43f5e; border-width:1.5px; }
            .custom-calendar .fc-timegrid-now-indicator-line::before {
              content:var(--current-time,""); position:absolute; left:-40px; top:-9px;
              background:#f43f5e; color:white; font-size:9px; padding:2px 5px; border-radius:4px; font-weight:800;
            }
            .custom-calendar .fc-daygrid-day:hover { background:rgba(148,163,184,0.04)!important; }
            .custom-calendar .fc-daygrid-day.fc-day-today { background:rgba(59,130,246,0.04)!important; }
            .custom-calendar .fc-timegrid-slot { height:2.6em!important; }
            .custom-calendar .fc-timegrid-slot-label-cushion { font-size:10px!important; color:#94a3b8; padding-right:6px!important; }
            .custom-calendar .fc-col-header-cell-cushion { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; padding:3px; }
            .custom-calendar .fc-daygrid-more-link { font-size:9px!important; font-weight:800!important; color:#64748b!important; padding:1px 5px!important; background:rgba(100,116,139,0.1)!important; border-radius:99px!important; margin:1px 3px!important; }
            @media (max-width:768px) { .fc-scrollgrid { min-width:100%!important; } }
          `}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
            initialView={currentView}
            headerToolbar={false}
            events={events}
            eventContent={renderEventContent}
            dayMaxEvents={3}
            datesSet={arg=>{setCalendarTitle(arg.view.title);setCurrentRenderDate(arg.view.currentStart);}}
            dateClick={()=>setTimeout(()=>{},10)}
            eventClick={arg=>openAddModal(arg.event.startStr,events.find(e=>e.id===arg.event.id))}
            dayCellContent={currentView==='dayGridMonth'?renderMonthCell:undefined}
            dayHeaderContent={renderHeaderContent}
            moreLinkClick={arg=>{triggerDailyModal(fmtYMD(arg.date));return'prevent';}}
            allDaySlot={false} slotDuration="01:00:00" slotMinTime="00:00:00" slotMaxTime="24:00:00"
            nowIndicator height="auto" scrollTime={getScrollTime()}
          />
        </div>
      </div>
    </div>

    {/* ── ALL MODALS (logic unchanged) ──────────────────────────────────────── */}

    {/* Mock history */}
    {isMockHistoryOpen&&(
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex justify-center items-center p-4">
        <div className="bg-white/92 dark:bg-slate-900/92 backdrop-blur-3xl w-full max-w-4xl rounded-[28px] shadow-2xl p-8 border border-white/20 relative max-h-[90vh] flex flex-col">
          <button onClick={()=>setIsMockHistoryOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={22}/></button>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-white"><History className="text-red-500"/>Mock Test History</h3>
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 pr-2">
            {mocks.length===0?<div className="text-center text-slate-500 font-bold py-10 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl">No mock tests recorded yet.</div>
              :mocks.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(m=>(
              <div key={m.id} className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between ${getMockBg(m)}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1"><span className="text-base font-black">{m.name}</span>
                    {m.isCompleted&&<span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${getScorePill(m)}`}>{m.score}/{m.type==='JEE Mains'?300:360}</span>}
                  </div>
                  <div className="text-xs font-semibold opacity-70 flex gap-3 flex-wrap"><span>📅 {m.date}</span><span>⏱️ {m.start}–{m.end}</span><span>🎯 {m.type}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{setIsMockHistoryOpen(false);openMockModal(m);}} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl"><Pencil size={14} className="text-slate-500"/></button>
                  <button onClick={()=>deleteMock(m.id)} className="p-2 hover:bg-red-600 hover:text-white rounded-xl"><Trash2 size={14} className="text-slate-500"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Score */}
    {isScoreModalOpen&&activeMockForScore&&(
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex justify-center items-center p-4">
        <div className="bg-white/92 dark:bg-slate-900/92 backdrop-blur-3xl w-full max-w-sm rounded-[28px] shadow-2xl p-8 border border-white/20 relative">
          <button onClick={()=>setIsScoreModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={22}/></button>
          <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white flex items-center gap-2"><Target className="text-green-500"/>Log Score</h3>
          <p className="text-sm font-semibold text-slate-500 mb-8">{activeMockForScore.name}</p>
          <div className="flex items-center justify-center gap-4 bg-slate-100/80 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-10">
            <input type="number" placeholder="0" value={tempScore} onChange={e=>setTempScore(e.target.value)}
              className="w-24 bg-transparent text-4xl font-black text-center focus:outline-none text-slate-900 dark:text-white appearance-none"/>
            <div className="w-px h-10 bg-slate-300 dark:bg-slate-600"/>
            <span className="text-2xl font-black text-slate-400">/{activeMockForScore.type==='JEE Mains'?300:360}</span>
          </div>
          <button onClick={handleMockScoreSubmit} className="w-full bg-green-600 hover:bg-green-500 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-green-500/30 active:scale-95">Submit</button>
        </div>
      </div>
    )}

    {/* Mock creation */}
    {isMockModalOpen&&(
      <div className="fixed inset-0 z-[99999] flex justify-center items-center p-4">
        <div className="bg-white/92 dark:bg-slate-900/92 backdrop-blur-3xl w-full max-w-xl rounded-[28px] shadow-2xl p-8 border border-white/20 max-h-[90vh] overflow-y-auto hide-scrollbar relative">
          <button onClick={()=>setIsMockModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={22}/></button>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-white"><Target className="text-blue-500"/>{mockEditId?'Edit Mock':'Schedule Mock'}</h3>
          {openDropdown&&<div className="fixed inset-0 z-[290]" onClick={()=>setOpenDropdown(null)}/>}
          <div className="space-y-5 relative">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mock Name *</label>
              <input type="text" placeholder="e.g. AITS-1" value={mockForm.name} onChange={e=>setMockForm({...mockForm,name:e.target.value})}
                className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white focus:outline-none"/>
            </div>
            <div className="flex gap-4"><DD label="Date" value={mockForm.date} options={NEXT_30_DAYS} typeKey="date" onChange={v=>setMockForm({...mockForm,date:v})}/><DD label="Type" value={mockForm.type} options={['JEE Mains','JEE Advanced']} typeKey="type" onChange={v=>setMockForm({...mockForm,type:v})}/></div>
            <div className="flex gap-4"><DD label="Start" value={mockForm.start} options={TIME_OPTIONS} typeKey="start" onChange={v=>setMockForm({...mockForm,start:v})}/><DD label="End" value={mockForm.end} options={TIME_OPTIONS} typeKey="end" onChange={v=>setMockForm({...mockForm,end:v})}/></div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Syllabus</label>
              <div className="flex gap-2 mb-3">{['Physics','Chemistry','Mathematics'].map(s=><button type="button" key={s} onClick={()=>setMockSubjectTab(mockSubjectTab===s?null:s)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${mockSubjectTab===s?'bg-blue-500 text-white':'bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}>{s}</button>)}</div>
              {mockSubjectTab&&<div className="bg-slate-100/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 max-h-[180px] overflow-y-auto mb-3 hide-scrollbar">
                {fullSyllabus.filter(s=>s.subject===mockSubjectTab).map(ch=>(
                  <label key={ch.id} className="flex items-center gap-3 p-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={mockForm.selectedChapters?.includes(ch.id)} onChange={e=>{if(e.target.checked)setMockForm({...mockForm,selectedChapters:[...(mockForm.selectedChapters||[]),ch.id]});else setMockForm({...mockForm,selectedChapters:mockForm.selectedChapters.filter(id=>id!==ch.id)});}} className="w-4 h-4 rounded text-blue-500"/>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{ch.title}</span>
                  </label>
                ))}
              </div>}
            </div>
            <button type="button" onClick={saveMockTest} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95">Save Mock</button>
          </div>
        </div>
      </div>
    )}

    {/* Task modal */}
    {isModalOpen&&(
      <div className="absolute inset-0 z-50 flex justify-center items-center p-4">
        <div className="bg-white/93 dark:bg-slate-900/93 backdrop-blur-3xl w-full max-w-md rounded-[28px] p-8 shadow-2xl border border-white/20 text-slate-800 dark:text-white relative max-h-[90vh] overflow-y-auto hide-scrollbar">
          <button onClick={()=>setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={22}/></button>
          <h3 className="text-xl font-black mb-7 flex items-center gap-3"><CalIcon className="text-blue-500"/>{editingId?'Edit Task':'New Task'}</h3>
          <input type="text" placeholder="Task name (e.g. Solve Irodov)" value={taskName} onChange={e=>setTaskName(e.target.value)} className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"/>
          <div className="flex bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-3 mb-5 border border-slate-200 dark:border-slate-700/50 h-[130px]">
            {[['Start',startTime,setStartTime],['End',endTime,setEndTime]].map(([label,val,set],li)=>(
              <React.Fragment key={label}>
                {li===1&&<div className="w-px bg-slate-200 dark:bg-slate-700 mx-3 my-2"/>}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest mb-2">{label}</span>
                  <div className="w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar flex-1">
                    <div className="h-[36px]"/>
                    {TIME_OPTIONS.map(t=><div key={`${label}-${t}`} onClick={()=>set(t)} className={`h-[36px] flex items-center justify-center snap-center cursor-pointer transition-all ${val===t?'text-blue-600 dark:text-white text-lg font-black bg-white dark:bg-white/10 rounded-xl shadow-sm border border-slate-200 dark:border-transparent':'text-slate-400 text-sm font-bold hover:text-slate-600 dark:hover:text-slate-300'}`}>{t}</div>)}
                    <div className="h-[36px]"/>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="mb-5">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Subject</label>
            <div className="flex gap-2">{['Physics','Chemistry','Mathematics'].map(s=><button type="button" key={s} onClick={()=>{setSubject(s);setLinkedChapterTitle('');}} className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold border transition-colors ${subject===s?'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400':'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100'}`}>{s==='Mathematics'?'Maths':s}</button>)}</div>
          </div>
          {availChapters.length>0&&<div className="mb-6"><label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Linked Chapter <span className="normal-case font-medium">(optional)</span></label><div className="flex flex-wrap gap-2">{availChapters.map(ch=><button type="button" key={ch.id} onClick={()=>setLinkedChapterTitle(linkedChapterTitle===ch.title?'':ch.title)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${linkedChapterTitle===ch.title?'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/50':'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{ch.title}</button>)}</div></div>}
          <div className="mb-8"><label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Color</label><div className="flex flex-wrap gap-2.5">{Object.entries(TASK_COLORS).map(([k,v])=><button type="button" key={k} onClick={()=>setTaskColorKey(k)} className={`w-7 h-7 rounded-full shadow-sm transition-all border-2 ${taskColorKey===k?'ring-4 ring-offset-2 dark:ring-offset-[#0f172a] scale-110':'hover:scale-110 opacity-70 hover:opacity-100'}`} style={{backgroundColor:v.bg,borderColor:v.border}}/>)}</div></div>
          <button type="button" onClick={handleSaveTask} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-2xl active:scale-95 shadow-lg shadow-blue-500/30">{editingId?'Save Changes':'Create Task'}</button>
        </div>
      </div>
    )}

    {/* Daily modal */}
    {dailyModal.isOpen&&(
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex justify-center items-center p-4" onClick={()=>setDailyModal(p=>({...p,isOpen:false}))}>
        <div className="bg-white/93 dark:bg-slate-900/93 backdrop-blur-3xl w-full max-w-lg rounded-[28px] p-8 shadow-2xl border border-white/20" onClick={e=>e.stopPropagation()}>
          <div className="flex justify-between items-center mb-7">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">{new Date(dailyModal.dateStr).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h3>
            <div className="flex gap-2">
              <button type="button" onClick={()=>openAddModal(dailyModal.dateStr)} className="p-2.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-full transition-colors"><Plus size={18}/></button>
              <button type="button" onClick={()=>setDailyModal(p=>({...p,isOpen:false}))} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full"><X size={18}/></button>
            </div>
          </div>
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 hide-scrollbar">
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">Tasks</h4>
              {dailyModal.tasks.length===0?<p className="text-slate-500 text-center py-4 font-semibold text-sm bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">No tasks scheduled.</p>
                :dailyModal.tasks.sort((a,b)=>(a.start||'').localeCompare(b.start||'')).map(task=>{
                  const k=task.colorKey||'blue',isDone=task.extendedProps?.done!==undefined?task.extendedProps.done:task.done,c=TASK_COLORS[k]||TASK_COLORS.blue;
                  return(<div key={task.id} style={{backgroundColor:c.bg,borderLeft:`4px solid ${c.border}`}} className={`flex justify-between items-center p-3.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform ${isDone?'opacity-50':''}`}>
                    <div className={`font-bold text-sm ${isDone?'line-through':''}`} style={{color:c.text}}>{task.title}</div>
                    <div className="flex items-center gap-2"><span className="text-[10px] font-black px-2 py-1 rounded-lg bg-black/10" style={{color:c.text}}>{extractTime(task.start,'00:00')}–{extractTime(task.end,'00:00')}</span>
                      <div className="flex gap-1"><button type="button" onClick={()=>openAddModal(task.start,task)} className="p-1.5 hover:bg-black/10 rounded-xl"><Pencil size={12} color={c.text}/></button><button type="button" onClick={()=>deleteTask(task.id)} className="p-1.5 hover:bg-red-500 rounded-xl"><Trash2 size={12} color={c.text}/></button></div>
                    </div>
                  </div>);
                })}
            </div>
            {dailyModal.dayMocks?.length>0&&<div>
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 border-b border-red-200 dark:border-red-900/30 pb-2">Mocks</h4>
              {dailyModal.dayMocks.map(m=><div key={m.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-white/30 dark:bg-black/20 border border-white/30 dark:border-white/5 mb-2">
                <div className="font-bold text-sm text-slate-800 dark:text-white">{m.name}</div>
                <div className="flex items-center gap-2"><span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">{m.start}–{m.end}</span><button type="button" onClick={()=>openMockModal(m)} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl"><Pencil size={12} className="text-slate-500"/></button><button type="button" onClick={()=>deleteMock(m.id)} className="p-1.5 hover:bg-red-600 rounded-xl"><Trash2 size={12} className="text-slate-500"/></button></div>
              </div>)}
            </div>}
          </div>
        </div>
      </div>
    )}

    {/* Chapter mapping */}
    {isChapterModalOpen&&(
      <div className="fixed inset-0 z-[99999] flex justify-center items-center p-4">
        <div className="bg-white/93 dark:bg-slate-900/93 backdrop-blur-3xl w-full max-w-5xl rounded-[28px] p-8 shadow-2xl border border-white/20 relative flex flex-col max-h-[85vh]">
          <button onClick={()=>setIsChapterModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={22}/></button>
          <h3 className="text-xl font-black mb-1">Map Chapters — {currentRenderDate.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h3>
          <p className="text-sm font-semibold text-slate-500 mb-7">Select chapters to add to this month's goals.</p>
          <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
              {['Physics','Chemistry','Mathematics'].map((subj,idx)=>{
                const sc=fullSyllabus.filter(c=>c.subject===subj);
                return(<div key={subj} className={`${idx!==0?'md:pl-8 pt-6 md:pt-0':'md:pr-8'}${idx===1?' md:pr-8':''}`}>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-4 border-b border-slate-200 dark:border-slate-800 pb-3" style={{color:SUBJ_COLOR[subj]}}>{subj}</h4>
                  <div className="grid gap-1.5 overflow-y-auto max-h-[45vh] hide-scrollbar pr-1">
                    {sc.map(ch=>{const isSel=pendingSelection.includes(ch.id);return(
                      <div key={ch.id} onClick={()=>pendingSelection.includes(ch.id)?setPendingSelection(pendingSelection.filter(i=>i!==ch.id)):setPendingSelection([...pendingSelection,ch.id])}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-colors ${isSel?'bg-blue-500/10 border-blue-500/30':'bg-slate-100/50 dark:bg-slate-800/30 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/60'}`}>
                        {isSel?<CheckSquare size={15} className="text-blue-500 flex-shrink-0"/>:<Square size={15} className="text-slate-400 dark:text-slate-600 flex-shrink-0"/>}
                        <span className={`text-xs font-semibold leading-tight ${isSel?'text-blue-600 dark:text-blue-400':'text-slate-700 dark:text-slate-300'}`}>{ch.title}</span>
                      </div>);
                    })}
                    {sc.length===0&&<div className="text-xs text-slate-400 py-4 text-center">No chapters yet.</div>}
                  </div>
                </div>);
              })}
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button onClick={handleSaveMonthlyChapters} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold py-4 px-10 rounded-2xl active:scale-95 shadow-lg shadow-blue-500/30">Save Chapters</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
