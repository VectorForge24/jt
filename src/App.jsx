import { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Clock, Play, Pause, RotateCcw, X, Settings, Image as ImageIcon, Trash2, SunDim, Upload, Download, CheckCircle, Save, Layers } from 'lucide-react';
import CalendarView from './CalendarView';
import SyllabusView from './SyllabusView';
import ProgressView from './ProgressView';
import TimerView from './TimerView';
import { useDriveSync } from './useDriveSync';

const fmtTime = (totalSec, showHrs=false) => {
  const h=Math.floor(totalSec/3600), m=Math.floor((totalSec%3600)/60), s=totalSec%60;
  if (showHrs||h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const compressImage = file => new Promise(resolve => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = ev => {
    const img = new Image();
    img.src = ev.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w=img.width, h=img.height;
      if (w>1920) { h=Math.round((h*1920)/w); w=1920; }
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      resolve(canvas.toDataURL('image/jpeg',0.6));
    };
  };
});

const THEMES = [
  { id:'blue',   name:'Ocean',     hex:'#3b82f6' },
  { id:'red',    name:'Crimson',   hex:'#ef4444' },
  { id:'green',  name:'Emerald',   hex:'#10b981' },
  { id:'orange', name:'Amber',     hex:'#f59e0b' },
  { id:'purple', name:'Amethyst',  hex:'#a855f7' },
  { id:'pink',   name:'Rose',      hex:'#ec4899' },
  { id:'cyan',   name:'Cyan',      hex:'#06b6d4' },
  { id:'yellow', name:'Gold',      hex:'#eab308' },
  { id:'slate',  name:'Graphite',  hex:'#64748b' },
];

const NAV_ITEMS = [
  { id:'calendar', icon:'📅', label:'Calendar' },
  { id:'syllabus', icon:'📚', label:'Syllabus' },
  { id:'progress', icon:'📈', label:'Progress' },
  { id:'timer',    icon:'⏱️', label:'Timer'    },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('tracker-theme')==='dark' || window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('tracker-color') || 'blue');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('tracker-bg') || null);

  const [colorIntensity, setColorIntensity] = useState(() => Number(localStorage.getItem('tracker-color-intensity') ?? 100));
  const [bgDimness,      setBgDimness]      = useState(() => Number(localStorage.getItem('tracker-bg-dimness')      ?? 20));
  const [tileOpacity,    setTileOpacity]    = useState(() => Number(localStorage.getItem('tracker-tile-opacity')    ?? 40));

  const [timerMode, setTimerMode] = useState('Pomodoro');
  const [pomodoroType, setPomodoroType] = useState('Focus');
  const [timeLeft, setTimeLeft] = useState(1500);
  const [totalTime, setTotalTime] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [islandState, setIslandState] = useState('hidden');

  const { isLoggedIn, token, loginWithGoogle, logoutGoogle, saveToDrive, isSyncing } = useDriveSync();

  const syncTimeoutRef = useRef(null);
  const triggerSync = useCallback(() => {
    if (!isLoggedIn || !token) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => { saveToDrive(token); }, 2500);
  }, [isLoggedIn, token, saveToDrive]);

  useEffect(() => {
    const triggerResize = () => window.dispatchEvent(new Event('resize'));
    const t1=setTimeout(triggerResize,150), t2=setTimeout(triggerResize,300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeTab]);

  const handleLocalExport = () => {
    const data = {};
    for (let i=0;i<localStorage.length;i++) {
      const k = localStorage.key(i);
      if (k.startsWith('tracker-')) data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`JEE_Tracker_Backup_${new Date().toLocaleDateString('en-US')}.json`;
    a.click();
  };

  const handleLocalImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data['tracker-events'] && !data['tracker-chapters']) { alert('❌ Invalid backup file — missing tracker data.'); return; }
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        if (isLoggedIn) {
          try { await saveToDrive(); alert('✅ Data imported and synced to cloud! App will restart.'); }
          catch { alert('✅ Data imported locally! Cloud sync will happen on next change.'); }
        } else { alert('✅ Data Imported Successfully! App will restart.'); }
        window.location.reload();
      } catch (err) {
        console.error('Import error:', err);
        alert('❌ Invalid Backup File! Make sure it is a valid JEE Tracker JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Timer engine
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (timerMode==='Stopwatch') return prev+1;
          if (prev<=1) {
            setIsRunning(false);
            if (activeTab!=='timer') { setIslandState('expanded'); setTimeout(()=>setIslandState(c=>c==='expanded'?'pill':c),1500); }
            return 0;
          }
          return prev-1;
        });
      },1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, activeTab]);

  useEffect(() => {
    if (timeLeft===0 && !isRunning && timerMode!=='Stopwatch' && totalTime>0) {
      const t = setTimeout(() => {
        setTimeLeft(totalTime);
        if (activeTab!=='timer') { setIslandState('closing'); setTimeout(()=>setIslandState('hidden'),400); }
      },3000);
      return () => clearTimeout(t);
    }
  }, [timeLeft, isRunning, timerMode, totalTime, activeTab]);

  useEffect(() => {
    const hasActive = isRunning || (timerMode==='Stopwatch'?timeLeft>0:timeLeft>0&&timeLeft<totalTime);
    if (activeTab!=='timer' && hasActive && islandState==='hidden') {
      setIslandState('expanded');
      const t=setTimeout(()=>setIslandState(p=>p==='expanded'?'pill':p),2000);
      return () => clearTimeout(t);
    } else if (activeTab==='timer') setIslandState('hidden');
  }, [activeTab, isRunning, timerMode, timeLeft, totalTime, islandState]);

  const handleTimerReset = () => {
    setIsRunning(false);
    setTimeLeft(timerMode==='Pomodoro'?(pomodoroType==='Focus'?1500:pomodoroType==='Short'?300:900):timerMode==='Stopwatch'?0:totalTime);
    setIslandState('closing'); setTimeout(()=>setIslandState('hidden'),400);
  };

  useEffect(() => {
    localStorage.setItem('tracker-theme', isDark?'dark':'light');
    if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    triggerSync();
  }, [isDark, triggerSync]);
  useEffect(() => { localStorage.setItem('tracker-color', activeTheme); document.documentElement.style.setProperty('--rank-color', THEMES.find(t=>t.id===activeTheme)?.hex||'#3b82f6'); triggerSync(); }, [activeTheme, triggerSync]);
  useEffect(() => { localStorage.setItem('tracker-color-intensity', colorIntensity.toString()); triggerSync(); }, [colorIntensity, triggerSync]);
  useEffect(() => { localStorage.setItem('tracker-bg-dimness', bgDimness.toString()); triggerSync(); }, [bgDimness, triggerSync]);
  useEffect(() => { localStorage.setItem('tracker-tile-opacity', tileOpacity.toString()); triggerSync(); }, [tileOpacity, triggerSync]);
  useEffect(() => { if (bgImage) localStorage.setItem('tracker-bg', bgImage); else localStorage.removeItem('tracker-bg'); triggerSync(); }, [bgImage, triggerSync]);

  const currentTheme = THEMES.find(t => t.id===activeTheme) || THEMES[0];

  const toggleThemeBtn = (
    <button onClick={()=>setIsDark(!isDark)}
      className="bg-white/30 dark:bg-white/8 backdrop-blur-md w-9 h-9 rounded-full hover:scale-110 transition-transform flex items-center justify-center shadow-md border border-white/20 dark:border-white/8 shrink-0">
      {isDark ? <Sun size={16} className="text-yellow-400"/> : <Moon size={16} className="text-indigo-500"/>}
    </button>
  );

  const timerIslandUI = islandState!=='hidden' && (
    <div className="relative flex items-center justify-center z-[100] h-9 w-[260px] shrink-0">
      <div className={`absolute right-0 top-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden shadow-inner border border-white/30 dark:border-white/8
        ${islandState==='expanded' ? 'w-[320px] h-[90px] rounded-[24px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-3xl p-3.5 z-[999] shadow-2xl'
        : islandState==='pill' ? 'w-[260px] h-9 rounded-full bg-slate-200/40 dark:bg-black/30 backdrop-blur-xl hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer flex items-center justify-center gap-2.5 z-[100]'
        : 'w-0 h-0 opacity-0 border-none'}`}
        onClick={e=>{e.stopPropagation(); if(islandState==='pill') setIslandState('expanded');}}>
        {islandState==='expanded' ? (
          <div className="flex flex-col w-full h-full justify-between">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-1.5">
                <Clock className={timeLeft===0&&!isRunning&&timerMode!=='Stopwatch'?'text-red-500':'text-blue-500'} size={13}/>
                <span className="font-extrabold text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-300">
                  {timeLeft===0&&!isRunning&&timerMode!=='Stopwatch'?(timerMode==='Countdown'?"Time's up!":'Timer Done'):'Focus Mode'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button onClick={e=>{e.stopPropagation();setIsRunning(!isRunning);}} className="hover:scale-110 transition-transform">
                  {isRunning?<Pause size={13} className="text-yellow-500" fill="currentColor"/>:<Play size={13} className="text-emerald-500" fill="currentColor"/>}
                </button>
                <button onClick={e=>{e.stopPropagation();handleTimerReset();}} className="hover:scale-110 transition-transform"><RotateCcw size={13} className="text-red-500"/></button>
                <button onClick={e=>{e.stopPropagation();setIslandState('pill');}} className="hover:scale-110 transition-transform ml-0.5"><X size={13} className="text-slate-400"/></button>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <span className={`font-black text-xl tabular-nums leading-none min-w-[78px] ${timeLeft===0&&!isRunning?'text-red-500':'text-slate-800 dark:text-white'}`}>{fmtTime(timeLeft)}</span>
              <div className="flex-1 bg-slate-200/50 dark:bg-slate-900/50 h-1.5 rounded-full overflow-hidden shadow-inner">
                <div className={`${timeLeft===0&&!isRunning?'bg-red-500':'bg-blue-500'} h-full transition-all duration-1000 ease-linear rounded-full`}
                  style={{width:`${timerMode==='Stopwatch'?100:(totalTime?((totalTime-timeLeft)/totalTime)*100:0)}%`}}/>
              </div>
            </div>
          </div>
        ) : islandState==='pill' ? (
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <Clock className={`text-blue-500 ${isRunning?'animate-pulse':''}`} size={13}/>
            <span className="font-black text-xs text-slate-800 dark:text-white tabular-nums">{fmtTime(timeLeft)}</span>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{timerMode}</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        :root { --rank-color: ${currentTheme.hex}; }
        .bg-white\\/40 { background-color: rgba(255,255,255,${tileOpacity/100}) !important; }
        .dark .dark\\:bg-slate-900\\/40 { background-color: rgba(15,23,42,${tileOpacity/100}) !important; }
        .dark .dark\\:bg-slate-800\\/40 { background-color: rgba(30,41,59,${tileOpacity/100}) !important; }
        .backdrop-blur-xl { backdrop-filter: blur(${(tileOpacity/100)*24}px) !important; -webkit-backdrop-filter: blur(${(tileOpacity/100)*24}px) !important; }
        .bg-white\\/20, .bg-white\\/30 { background-color: rgba(255,255,255,${(tileOpacity/100)*0.25}) !important; }
        .dark .dark\\:bg-slate-800\\/30 { background-color: rgba(30,41,59,${(tileOpacity/100)*0.3}) !important; }
        .dark .dark\\:bg-black\\/20 { background-color: rgba(0,0,0,${(tileOpacity/100)*0.2}) !important; }
        .glass-card { background: rgba(255,255,255,${(tileOpacity/100)*0.55}) !important; backdrop-filter: blur(${(tileOpacity/100)*28}px) saturate(1.6) !important; -webkit-backdrop-filter: blur(${(tileOpacity/100)*28}px) saturate(1.6) !important; }
        .dark .glass-card { background: rgba(15,23,42,${(tileOpacity/100)*0.65}) !important; }
      `}</style>

      <div className="flex flex-col min-h-screen w-full overflow-x-hidden text-slate-800 dark:text-slate-100 transition-colors duration-300 relative bg-slate-100 dark:bg-[#080c14]"
        style={{ backgroundImage: bgImage?`url(${bgImage})`:'none', backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }}>

        <div className="absolute inset-0 pointer-events-none z-0 transition-colors duration-300" style={{ backgroundColor:`rgba(0,0,0,${bgDimness/100})`, position:'fixed' }}/>

        {!bgImage && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ opacity: colorIntensity/100 }}>
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] transition-colors duration-1000" style={{background:`${currentTheme.hex}40`}}/>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] transition-colors duration-1000" style={{background:`${currentTheme.hex}25`}}/>
          </div>
        )}

        {/* Top nav */}
        <nav className="sticky top-0 w-full bg-white/35 dark:bg-slate-900/45 backdrop-blur-2xl flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 z-[200] shrink-0 shadow-sm border-b border-white/20 dark:border-white/6">
          <div className="flex-1 flex justify-start items-center">
            <h1 className="text-lg font-bold tracking-tight hidden sm:block" style={{color:currentTheme.hex}}>JEE Tracker</h1>
            <h1 className="text-lg font-bold tracking-tight sm:hidden" style={{color:currentTheme.hex}}>JEE</h1>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-3">
            {NAV_ITEMS.map(item => (
              <NavButton key={item.id} icon={item.icon} label={item.label} isActive={activeTab===item.id}
                onClick={()=>setActiveTab(item.id)} themeHex={currentTheme.hex}/>
            ))}
          </div>

          <div className="flex-1 flex justify-end items-center">
            <button onClick={()=>setIsSettingsOpen(true)} title="Settings"
              className="p-2 sm:p-2.5 rounded-full transition-all text-slate-600 dark:text-slate-300 hover:bg-white/25 dark:hover:bg-white/8 hover:text-slate-900 dark:hover:text-white group">
              <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500 shrink-0"/>
            </button>
          </div>
        </nav>

        <main className="flex-1 p-2 md:p-4 flex flex-col z-10 relative">
          {activeTab==='calendar' && <CalendarView themeToggle={toggleThemeBtn} timerIsland={timerIslandUI} syncTrigger={triggerSync}/>}
          {activeTab==='syllabus' && <SyllabusView themeToggle={toggleThemeBtn} timerIsland={timerIslandUI} syncTrigger={triggerSync}/>}
          {activeTab==='progress' && <ProgressView themeToggle={toggleThemeBtn} timerIsland={timerIslandUI} syncTrigger={triggerSync}/>}
          {activeTab==='timer'    && <TimerView themeToggle={toggleThemeBtn} timerMode={timerMode} setTimerMode={setTimerMode} pomodoroType={pomodoroType} setPomodoroType={setPomodoroType} timeLeft={timeLeft} setTimeLeft={setTimeLeft} totalTime={totalTime} setTotalTime={setTotalTime} isRunning={isRunning} setIsRunning={setIsRunning} syncTrigger={triggerSync}/>}
        </main>
      </div>

      {/* Settings modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-md z-[9999] flex justify-center items-center p-4">
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl w-full max-w-md rounded-[28px] p-7 relative shadow-2xl border border-white/20 dark:border-white/8 max-h-[90vh] overflow-y-auto hide-scrollbar">
            <button onClick={()=>setIsSettingsOpen(false)} className="absolute top-5 right-5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><X size={22}/></button>

            <h3 className="text-xl font-black mb-6 text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
              <Settings style={{color:currentTheme.hex}}/> Settings
            </h3>

            <div className="mb-5">
              <label className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-2.5 block">Color Theme</label>
              <div className="flex flex-wrap gap-2.5">
                {THEMES.map(theme => (
                  <button key={theme.id} onClick={()=>setActiveTheme(theme.id)}
                    className={`w-7 h-7 rounded-full shadow-md transition-all ${activeTheme===theme.id?'ring-4 ring-offset-2 dark:ring-offset-[#0f172a] scale-110':'hover:scale-110 opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor:theme.hex, ...(activeTheme===theme.id?{'--tw-ring-color':theme.hex}:{}) }} title={theme.name}/>
                ))}
              </div>
            </div>

            {!bgImage && (
              <div className="mb-5">
                <label className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><SunDim size={14}/> Orb Intensity</span>
                  <span style={{color:currentTheme.hex}}>{colorIntensity}%</span>
                </label>
                <input type="range" min="0" max="100" step="5" value={colorIntensity} onChange={e=>setColorIntensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
              </div>
            )}

            <div className="mb-5">
              <label className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Moon size={14}/> BG Dimness</span>
                <span style={{color:currentTheme.hex}}>{bgDimness}%</span>
              </label>
              <input type="range" min="0" max="90" step="5" value={bgDimness} onChange={e=>setBgDimness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
            </div>

            <div className="mb-5">
              <label className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Layers size={14}/> Glass Opacity</span>
                <span style={{color:currentTheme.hex}}>{tileOpacity}%</span>
              </label>
              <input type="range" min="0" max="100" step="5" value={tileOpacity} onChange={e=>setTileOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
            </div>

            <div className="mb-2 border-t border-slate-200/60 dark:border-white/8 pt-5 mt-5">
              <label className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-2.5 flex items-center gap-1.5"><ImageIcon size={14}/> Custom Wallpaper</label>
              <div className="flex items-center gap-3">
                {bgImage && <img src={bgImage} alt="Wallpaper" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md"/>}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-white text-sm font-bold py-2 px-4 rounded-2xl cursor-pointer text-center transition-colors shadow-lg" style={{background:currentTheme.hex}}>
                    Upload Image
                    <input type="file" accept="image/*" onChange={async e => { if(e.target.files[0]) { setBgImage(await compressImage(e.target.files[0])); e.target.value=null; } }} className="hidden"/>
                  </label>
                  {bgImage && <button onClick={()=>setBgImage(null)} className="flex items-center justify-center gap-1.5 bg-red-500/15 text-red-500 text-xs font-bold py-2 px-4 rounded-2xl transition-colors hover:bg-red-500 hover:text-white"><Trash2 size={14}/> Remove</button>}
                </div>
              </div>
            </div>

            <div className="mb-2 mt-6 pt-5 border-t border-slate-200/60 dark:border-white/8">
              <label className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Save size={14} className="text-emerald-500"/> Data Backup & Sync</span>
                {isSyncing && <span className="text-[9px] bg-blue-500/15 text-blue-500 px-2 py-0.5 rounded-full animate-pulse">Syncing…</span>}
              </label>

              <div className="flex flex-col gap-2.5">
                {isLoggedIn ? (
                  <div className="flex items-center justify-between bg-green-500/8 border border-green-500/25 p-2.5 rounded-2xl">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5"><CheckCircle size={14}/> Cloud Sync Active</span>
                    <button onClick={logoutGoogle} className="text-[10px] font-bold text-slate-500 hover:text-red-500">Disconnect</button>
                  </div>
                ) : (
                  <button onClick={()=>loginWithGoogle()}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold py-2.5 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2.5 transition-colors">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4"/> Sign in with Google
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button onClick={handleLocalExport}
                    className="flex items-center justify-center gap-1.5 bg-slate-200/40 dark:bg-white/6 hover:bg-slate-300/40 dark:hover:bg-white/12 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-colors">
                    <Download size={13}/> Export Backup
                  </button>
                  <label className="flex items-center justify-center gap-1.5 bg-slate-200/40 dark:bg-white/6 hover:bg-slate-300/40 dark:hover:bg-white/12 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors">
                    <Upload size={13}/> Import Data
                    <input type="file" accept=".json" onChange={handleLocalImport} className="hidden"/>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavButton({ icon, label, isActive, onClick, themeHex }) {
  return (
    <button onClick={onClick} title={label}
      className="relative flex items-center justify-center rounded-full transition-all w-9 h-9 sm:w-11 sm:h-11"
      style={isActive ? { background:themeHex, color:'#fff', boxShadow:`0 4px 14px ${themeHex}55`, transform:'scale(1.05)' } : {}}>
      <span className={`text-base sm:text-lg shrink-0 ${!isActive ? 'opacity-70 hover:opacity-100' : ''}`}>{icon}</span>
    </button>
  );
}
