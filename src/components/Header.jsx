import { Settings, Cloud, CloudOff, BellRing } from 'lucide-react';

export default function Header({ title, isLoggedIn, isSyncing, onSettingsClick, themeHex='#3b82f6', notifPermission, onNotifClick }) {
  return (
    <header className="safe-top" style={{
      position:'sticky', top:0, zIndex:40, display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px 16px', background:'rgba(11,17,32,0.92)', backdropFilter:'blur(16px)',
      borderBottom:'1px solid rgba(255,255,255,0.06)',
    }}>
      <h1 style={{ fontSize:18, fontWeight:700, color:themeHex, margin:0 }}>{title}</h1>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
          <button onClick={onNotifClick} title="Enable notifications"
            style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)' }}>
            <BellRing size={15} color="#f59e0b"/>
          </button>
        )}

        <div title={isLoggedIn ? (isSyncing ? 'Syncing…' : 'Synced') : 'Not signed in'}
          style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            background: isLoggedIn ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)' }}>
          {isLoggedIn
            ? <Cloud size={15} color={isSyncing ? '#f59e0b' : '#10b981'} className={isSyncing ? 'animate-pulse-slow' : ''}/>
            : <CloudOff size={15} color="#64748b"/>}
        </div>

        <button onClick={onSettingsClick}
          style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Settings size={16} color="#94a3b8"/>
        </button>
      </div>
    </header>
  );
}
