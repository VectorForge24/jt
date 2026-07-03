import { useRef } from 'react';
import BottomSheet from './BottomSheet.jsx';
import { CheckCircle, Download, Upload, Trash2, BellRing, BellOff } from 'lucide-react';

const THEMES = [
  { id:'blue',   hex:'#3b82f6' }, { id:'red',    hex:'#ef4444' }, { id:'green',  hex:'#10b981' },
  { id:'orange', hex:'#f59e0b' }, { id:'purple', hex:'#a855f7' }, { id:'pink',   hex:'#ec4899' },
  { id:'cyan',   hex:'#06b6d4' }, { id:'yellow', hex:'#eab308' }, { id:'slate',  hex:'#64748b' },
];

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > 1280) { h = Math.round(h*1280/w); w = 1280; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function SettingsSheet({
  isOpen, onClose, activeTheme, setActiveTheme, bgImage, setBgImage,
  bgDimness, setBgDimness, glassOpacity, setGlassOpacity,
  isLoggedIn, isSyncing, onLogin, onLogout,
  onExport, onImport, notifPermission, onRequestNotif,
}) {
  const fileRef = useRef();
  const currentHex = THEMES.find(t => t.id===activeTheme)?.hex || '#3b82f6';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Settings">

      <Section label="Theme Color">
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setActiveTheme(t.id)}
              style={{ width:32, height:32, borderRadius:'50%', background:t.hex,
                outline: activeTheme===t.id ? '3px solid rgba(255,255,255,0.5)' : 'none', outlineOffset:2 }}/>
          ))}
        </div>
      </Section>

      <Section label="Notifications">
        <button onClick={onRequestNotif} disabled={notifPermission==='granted'}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
            padding:'12px 14px', borderRadius:14,
            background: notifPermission==='granted' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${notifPermission==='granted' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
          <span style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700,
            color: notifPermission==='granted' ? '#34d399' : '#fbbf24' }}>
            {notifPermission==='granted' ? <BellRing size={16}/> : <BellOff size={16}/>}
            {notifPermission==='granted' ? 'Notifications enabled'
              : notifPermission==='denied' ? 'Notifications blocked — enable in browser settings'
              : 'Enable task deadline alerts'}
          </span>
        </button>
        <p style={{ fontSize:11, color:'#64748b', marginTop:8, lineHeight:1.5 }}>
          Get a heads-up 15–30 minutes before a task ends if it's still unmarked — including a penalty-zone warning when time's almost out.
        </p>
      </Section>

      <Section label="Background Dimness">
        <input type="range" min="0" max="90" step="5" value={bgDimness} onChange={e => setBgDimness(Number(e.target.value))}
          style={{ width:'100%', accentColor:currentHex }}/>
      </Section>

      <Section label="Glass Opacity">
        <input type="range" min="20" max="90" step="5" value={glassOpacity} onChange={e => setGlassOpacity(Number(e.target.value))}
          style={{ width:'100%', accentColor:currentHex }}/>
        <p style={{ fontSize:11, color:'#64748b', marginTop:6 }}>Controls how see-through cards, the header, and icon buttons are.</p>
      </Section>

      <Section label="Wallpaper">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {bgImage && <img src={bgImage} alt="" style={{ width:48, height:48, borderRadius:12, objectFit:'cover' }}/>}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ padding:'9px 0', textAlign:'center', borderRadius:12, fontSize:12, fontWeight:700, color:'#fff',
              background: currentHex, cursor:'pointer' }}>
              Upload Image
              <input type="file" accept="image/*" style={{ display:'none' }}
                onChange={async e => { if (e.target.files[0]) { setBgImage(await compressImage(e.target.files[0])); e.target.value=null; } }}/>
            </label>
            {bgImage && (
              <button onClick={() => setBgImage(null)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'7px 0', borderRadius:12, fontSize:11, fontWeight:700, color:'#f87171', background:'rgba(239,68,68,0.1)', border:'none' }}>
                <Trash2 size={12}/> Remove
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section label="Data & Sync">
        {isLoggedIn ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px',
            borderRadius:14, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'#34d399' }}>
              <CheckCircle size={14}/> {isSyncing ? 'Syncing…' : 'Cloud sync active'}
            </span>
            <button onClick={onLogout} style={{ fontSize:11, fontWeight:700, color:'#64748b', background:'none', border:'none' }}>Disconnect</button>
          </div>
        ) : (
          <button onClick={onLogin} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            padding:'12px 0', borderRadius:14, background:'#fff', border:'1px solid #e2e8f0', fontSize:13, fontWeight:700, color:'#1e293b' }}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" style={{ width:16, height:16 }}/> Sign in with Google
          </button>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
          <button onClick={onExport} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'10px 0', borderRadius:12, fontSize:11, fontWeight:700, color:'#cbd5e1', background:'rgba(255,255,255,0.05)', border:'none' }}>
            <Download size={13}/> Export
          </button>
          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'10px 0', borderRadius:12, fontSize:11, fontWeight:700, color:'#cbd5e1', background:'rgba(255,255,255,0.05)', cursor:'pointer' }}>
            <Upload size={13}/> Import
            <input type="file" accept=".json" style={{ display:'none' }} onChange={onImport}/>
          </label>
        </div>
      </Section>
    </BottomSheet>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom:22 }}>
      <p style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>{label}</p>
      {children}
    </div>
  );
}

export { THEMES };
