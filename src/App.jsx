import { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppState } from './hooks/useAppState.js';
import { useTaskNotifications } from './hooks/useTaskNotifications.js';

import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import SettingsSheet, { THEMES } from './components/SettingsSheet.jsx';
import RankAnimation, { BonusToast } from './components/RankAnimation.jsx';

import HomePage from './pages/HomePage.jsx';
import SyllabusPage from './pages/SyllabusPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import TimerPage from './pages/TimerPage.jsx';
import RankingPage from './pages/RankingPage.jsx';

const PAGE_TITLES = { '/':'Today', '/syllabus':'Syllabus', '/progress':'Progress', '/timer':'Timer', '/ranking':'Ranking' };

function LoginScreen({ onLogin }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:28, background:'#0b1120' }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.08) 0%, transparent 60%)', pointerEvents:'none' }}/>
      <motion.div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:340 }}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        <h1 style={{ fontSize:34, fontWeight:800, color:'#fff', marginBottom:6, fontFamily:"'Space Mono',monospace" }}>JEE TRACKER</h1>
        <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6, marginBottom:28 }}>
          Tasks, syllabus, mocks, and a live rank you climb by studying.
        </p>
        <button onClick={onLogin} style={{ width:'100%', padding:'14px 0', borderRadius:16, fontSize:15, fontWeight:700,
          background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'#fff', border:'none', boxShadow:'0 8px 28px rgba(59,130,246,0.35)' }}>
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, background:'#0b1120' }}>
      <motion.div style={{ width:32, height:32, borderRadius:'50%', border:'2.5px solid transparent', borderTopColor:'#3b82f6', borderRightColor:'rgba(59,130,246,0.3)' }}
        animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}/>
      <p style={{ fontSize:12, color:'#64748b' }}>Syncing…</p>
    </div>
  );
}

export default function App() {
  const appState = useAppState();
  const { isLoggedIn, uid, isSyncing, loginWithGoogle, logout, events, animQueue, consumeAnim, todayResult, rank } = appState;

  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('tracker-color') || 'blue');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('tracker-bg') || null);
  const [bgDimness, setBgDimness] = useState(() => Number(localStorage.getItem('tracker-bg-dimness') ?? 30));

  const { permission: notifPermission, requestPermission: requestNotifPermission } = useTaskNotifications(events);

  useEffect(() => { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t); }, []);
  useEffect(() => { localStorage.setItem('tracker-color', activeTheme); }, [activeTheme]);
  useEffect(() => { if (bgImage) localStorage.setItem('tracker-bg', bgImage); else localStorage.removeItem('tracker-bg'); }, [bgImage]);
  useEffect(() => { localStorage.setItem('tracker-bg-dimness', String(bgDimness)); }, [bgDimness]);
  useEffect(() => { document.documentElement.classList.add('dark'); }, []);

  const currentHex = THEMES.find(t => t.id===activeTheme)?.hex || '#3b82f6';

  const handleExport = useCallback(() => {
    const data = {};
    for (let i=0;i<localStorage.length;i++) { const k = localStorage.key(i); if (k.startsWith('tracker-')) data[k] = localStorage.getItem(k); }
    const blob = new Blob([JSON.stringify(data)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `JEE_Tracker_Backup_${new Date().toLocaleDateString('en-US')}.json`; a.click();
  }, []);

  const handleImport = useCallback((e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data['tracker-events'] && !data['tracker-chapters']) { alert('❌ Invalid backup file.'); return; }
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        alert('✅ Data imported! Reloading…');
        window.location.reload();
      } catch { alert('❌ Invalid backup file.'); }
    };
    reader.readAsText(file);
  }, []);

  if (!ready) return <LoadingScreen/>;
  if (!isLoggedIn) return <LoginScreen onLogin={loginWithGoogle}/>;

  const bonusEvents = todayResult?.summary?.bonusEvents || [];

  return (
    <HashRouter>
      <div style={{ minHeight:'100vh', background:'#0b1120',
        backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }}>

        <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:`rgba(0,0,0,${bgDimness/100})`, zIndex:0 }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <RouteAwareHeader isLoggedIn={isLoggedIn} isSyncing={isSyncing} onSettingsClick={() => setSettingsOpen(true)}
            themeHex={currentHex} notifPermission={notifPermission} onNotifClick={requestNotifPermission}/>

          <RankAnimation animQueue={animQueue} consumeAnim={consumeAnim}/>
          <AnimatePresence>
            {bonusEvents.length > 0 && <BonusToast key="toast" events={bonusEvents} onDone={() => {}}/>}
          </AnimatePresence>

          <main>
            <Routes>
              <Route path="/"          element={<HomePage appState={appState}/>}/>
              <Route path="/syllabus"  element={<SyllabusPage appState={appState}/>}/>
              <Route path="/progress"  element={<ProgressPage appState={appState}/>}/>
              <Route path="/timer"     element={<TimerPage appState={appState}/>}/>
              <Route path="/ranking"   element={<RankingPage appState={appState}/>}/>
            </Routes>
          </main>

          <BottomNav themeHex={currentHex}/>
        </div>

        <SettingsSheet
          isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
          activeTheme={activeTheme} setActiveTheme={setActiveTheme}
          bgImage={bgImage} setBgImage={setBgImage}
          bgDimness={bgDimness} setBgDimness={setBgDimness}
          isLoggedIn={isLoggedIn} isSyncing={isSyncing} onLogin={loginWithGoogle} onLogout={logout}
          onExport={handleExport} onImport={handleImport}
          notifPermission={notifPermission} onRequestNotif={requestNotifPermission}
        />
      </div>
    </HashRouter>
  );
}

// Small helper so the header title updates per-route without lifting router state up
function RouteAwareHeader(props) {
  const [title, setTitle] = useState('Today');
  useEffect(() => {
    const update = () => setTitle(PAGE_TITLES[window.location.hash.replace('#','') || '/'] || 'JEE Tracker');
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <Header title={title} {...props}/>;
}
