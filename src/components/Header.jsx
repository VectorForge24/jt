import { Settings, Cloud, CloudOff, BellRing, BellOff, RefreshCw } from 'lucide-react';
import RankBadge from './RankBadge.jsx';

// Fix #9a: "Today" title replaced by the ranking profile snippet (badge + rank + name).
// Fix #9b (part 1): cloud icon is now a real button — tap to force a manual re-sync.
// Fix #9b (part 2): notification bell is always visible and reflects real state
// (granted/denied/default) instead of vanishing once granted, with no feedback either way.
export default function Header({
  isLoggedIn, isSyncing, onSettingsClick, themeHex='#3b82f6',
  notifPermission, onNotifClick, onProfileClick,
  rank, username, userPosition, onManualSync,
}) {
  return (
    <header className="safe-top glass-bg-strong-var" style={{
      position:'sticky', top:0, zIndex:40, display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'10px 16px', backdropFilter:'blur(16px)',
      borderBottom:'1px solid rgba(255,255,255,0.06)', gap:8,
    }}>
      {/* Profile chip — replaces the old static page title */}
      <button onClick={onProfileClick}
        style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', padding:0, minWidth:0, flex:1 }}>
        {rank && <RankBadge rank={rank} size="xs" animate={false}/>}
        <div style={{ minWidth:0, textAlign:'left' }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#fff', margin:0, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {username || 'Aspirant'}
          </p>
          {rank && (
            <p style={{ fontSize:10, fontWeight:600, color:themeHex, margin:0, lineHeight:1.3 }}>
              {rank.tier} {rank.sub}{userPosition ? ` · #${userPosition}` : ''}
            </p>
          )}
        </div>
      </button>

      <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
        {/* Notification bell — always visible, tappable, reflects real permission state */}
        <button onClick={onNotifClick} title={
            notifPermission==='granted' ? 'Notifications on' :
            notifPermission==='denied'  ? 'Notifications blocked — tap for help' :
            'Enable task deadline alerts'
          }
          style={{ width:32, height:32, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center',
            background: notifPermission==='granted' ? 'rgba(16,185,129,0.12)' : notifPermission==='denied' ? 'rgba(148,163,184,0.1)' : 'rgba(245,158,11,0.12)' }}>
          {notifPermission==='granted'
            ? <BellRing size={14} color="#34d399"/>
            : notifPermission==='denied'
              ? <BellOff size={14} color="#64748b"/>
              : <BellRing size={14} color="#f59e0b"/>}
        </button>

        {/* Cloud sync — now a real button, tap to force a manual re-sync */}
        <button onClick={onManualSync} title={isLoggedIn ? (isSyncing ? 'Syncing…' : 'Tap to sync now') : 'Not signed in'}
          style={{ width:32, height:32, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center',
            background: isLoggedIn ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)' }}>
          {isSyncing
            ? <RefreshCw size={14} color="#f59e0b" className="animate-pulse-slow"/>
            : isLoggedIn
              ? <Cloud size={14} color="#34d399"/>
              : <CloudOff size={14} color="#64748b"/>}
        </button>

        <button onClick={onSettingsClick} className="glass-bg-var"
          style={{ width:32, height:32, borderRadius:'50%', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Settings size={15} color="#94a3b8"/>
        </button>
      </div>
    </header>
  );
}
