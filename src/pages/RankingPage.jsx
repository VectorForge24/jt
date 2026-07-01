import { useState } from 'react';
import RankBadge, { RankChip } from '../components/RankBadge.jsx';
import XPBar from '../components/XPBar.jsx';
import { ACHIEVEMENTS } from '../engine/xpEngine.js';

export default function RankingPage({ appState }) {
  const { rank, subXP, rankingState, todayResult, username, setUsername, leaderboard, positionDeltas, userPosition, userProfile } = appState;
  const [tab, setTab] = useState('profile');
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px' }}>
        {[['profile','Profile'],['leaderboard','Leaderboard']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex:1, padding:'10px 0', borderRadius:12, fontSize:13, fontWeight:700,
              background: tab===id ? `${rank.color}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${tab===id ? rank.color+'44' : 'rgba(255,255,255,0.06)'}`,
              color: tab===id ? rank.color : '#64748b' }}>
            {label}
          </button>
        ))}
        <button onClick={() => setHelpOpen(true)}
          style={{ width:38, borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#64748b', fontWeight:700 }}>
          ?
        </button>
      </div>

      {tab==='profile'
        ? <ProfileTab rank={rank} subXP={subXP} rankingState={rankingState} todayResult={todayResult} username={username} setUsername={setUsername} userPosition={userPosition} userProfile={userProfile}/>
        : <LeaderboardTab leaderboard={leaderboard} positionDeltas={positionDeltas} userPosition={userPosition}/>
      }

      {helpOpen && <HelpSheet rank={rank} onClose={() => setHelpOpen(false)}/>}
    </div>
  );
}

function ProfileTab({ rank, subXP, rankingState, todayResult, username, setUsername, userPosition, userProfile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(username);
  const earned = new Set(rankingState?.achievements || []);
  const history = rankingState?.history || [];
  const activeDays = history.filter(h => h.hasData);
  const perfectDays = activeDays.filter(h => h.pct===100).length;
  const avgXP = activeDays.length ? Math.round(activeDays.reduce((s,h) => s+Math.max(0,h.xp),0)/activeDays.length) : 0;
  const totalXP = rankingState?.totalXP || 0;

  return (
    <div style={{ padding:'0 16px' }}>
      {/* Rank card */}
      <div style={{ borderRadius:20, padding:'18px', background:`${rank.bg}dd`, border:`1px solid ${rank.color}30`, marginBottom:12 }}>
        <div style={{ display:'flex', gap:14, marginBottom:14 }}>
          <RankBadge rank={rank} size="lg" animate/>
          <div style={{ flex:1, minWidth:0 }}>
            {editing ? (
              <div style={{ display:'flex', gap:6 }}>
                <input value={draft} onChange={e => setDraft(e.target.value)} maxLength={20} autoFocus
                  style={{ flex:1, background:'transparent', border:'none', borderBottom:`2px solid ${rank.color}`, color:'#fff', fontSize:18, fontWeight:700, outline:'none' }}/>
                <button onClick={() => { setUsername(draft.trim()); setEditing(false); }} style={{ fontSize:11, fontWeight:700, color:rank.color, background:'none', border:'none' }}>Save</button>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <h2 style={{ fontSize:19, fontWeight:800, color:'#fff', margin:0 }}>{username || 'Aspirant'}</h2>
                <button onClick={() => { setDraft(username); setEditing(true); }}
                  style={{ width:22, height:22, borderRadius:6, background:'rgba(255,255,255,0.08)', border:'none' }}>✏️</button>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:700, color:rank.color }}>{rank.tier} {rank.sub}</span>
              {userPosition && <span style={{ fontSize:11, color:'#94a3b8', background:'rgba(255,255,255,0.06)', padding:'1px 8px', borderRadius:99 }}>#{userPosition}</span>}
            </div>
          </div>
        </div>
        <XPBar rank={rank} subXP={subXP}/>
        <div style={{ marginTop:10, padding:'8px 12px', borderRadius:10, background:'rgba(255,255,255,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:10, color:'#64748b', textTransform:'uppercase' }}>Total XP</span>
            <span style={{ fontSize:12, fontWeight:700, color:rank.glow, fontFamily:"'Space Mono',monospace" }}>{totalXP.toLocaleString()} / 27,000</span>
          </div>
          <div style={{ marginTop:5, height:3, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(100,(totalXP/27000)*100)}%`, background:`linear-gradient(90deg,${rank.color}88,${rank.glow})` }}/>
          </div>
        </div>
      </div>

      {/* Today's breakdown */}
      {todayResult && (
        <div style={{ borderRadius:16, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:12 }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', margin:'0 0 10px' }}>Today's Result</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:12 }}>
            {[
              ['Completion', `${todayResult.summary.pct.toFixed(0)}%`],
              ['Tier', `${todayResult.summary.tier?.emoji||''} ${todayResult.summary.tier?.name||'—'}`],
              ['Base XP', `+${todayResult.summary.baseXP}`],
              ['Streak Bonus', todayResult.summary.streakBonus>0 ? `+${todayResult.summary.streakBonus}` : '—'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color:'#64748b' }}>{k}</span><span style={{ fontWeight:700, color:rank.glow }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800 }}>
            <span style={{ color:'#e2e8f0' }}>Total today</span>
            <span style={{ color: todayResult.xpDelta>=0 ? '#4ade80' : '#f87171' }}>{todayResult.xpDelta>=0?'+':''}{todayResult.xpDelta} XP</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        {[['Avg XP/Day',avgXP],['Perfect Days',perfectDays]].map(([l,v]) => (
          <div key={l} style={{ borderRadius:14, padding:'12px 14px', background:'rgba(255,255,255,0.03)' }}>
            <p style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', margin:'0 0 4px' }}>{l}</p>
            <p style={{ fontSize:17, fontWeight:800, color:rank.color, margin:0, fontFamily:"'Space Mono',monospace" }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ borderRadius:16, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', margin:'0 0 10px' }}>Achievements</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {ACHIEVEMENTS.map(a => {
            const has = earned.has(a.id);
            return (
              <div key={a.id} title={a.desc} style={{ borderRadius:12, padding:'10px', textAlign:'center',
                background: has ? `${rank.color}10` : 'rgba(255,255,255,0.02)', opacity: has?1:0.4, filter: has?'none':'grayscale(1)' }}>
                <div style={{ fontSize:18 }}>{has?a.emoji:'🔒'}</div>
                <p style={{ fontSize:9, fontWeight:700, color: has?rank.color:'#475569', margin:'4px 0 0', lineHeight:1.2 }}>{a.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeaderboardTab({ leaderboard, positionDeltas, userPosition }) {
  const near = leaderboard.filter(e => userPosition ? Math.abs(e.position - userPosition) <= 15 : e.position <= 30);
  return (
    <div style={{ padding:'0 16px' }}>
      {near.map(e => (
        <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:14, marginBottom:4,
          background: e.isRealUser ? `${e.rank.color}12` : 'transparent', border: e.isRealUser ? `1px solid ${e.rank.color}30` : '1px solid transparent' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#64748b', width:32, fontFamily:"'Space Mono',monospace" }}>#{e.position}</span>
          <span style={{ fontSize:13, fontWeight: e.isRealUser?800:500, color: e.isRealUser?e.rank.color:'#cbd5e1', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {e.isRealUser?'⭐ ':''}{e.username}
          </span>
          <RankChip rank={e.rank}/>
          <span style={{ fontSize:11, fontWeight:700, color: e.todayXP>=0?'#4ade80':'#f87171', fontFamily:"'Space Mono',monospace", minWidth:44, textAlign:'right' }}>
            {e.todayXP>=0?'+':''}{e.todayXP}
          </span>
        </div>
      ))}
    </div>
  );
}

function HelpSheet({ rank, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', borderRadius:'20px 20px 0 0', width:'100%', maxHeight:'80vh', overflowY:'auto', padding:'16px 20px 30px' }}>
        <div className="sheet-handle"/>
        <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:'8px 0 14px' }}>How Ranking Works</h3>
        <p style={{ fontSize:12, color:'#94a3b8', lineHeight:1.7 }}>
          XP = registered hours × 100 × completion multiplier.<br/>
          🔥 90%+ = 1.5× · ⚡ 75%+ = 1.2× · ✅ 55%+ = 0.9× · ⚠️ 35%+ = 0.55× · 🔻 15%+ = 0.2× · 💀 &lt;15% = −0.4×<br/><br/>
          1,500 XP fills one sub-rank. 18 sub-ranks = 27,000 XP to Conqueror I. Streaks of 3/5/7/10 days at 85%+ earn bonus XP; streaks of 3/5/7 days below 20% cost extra penalty XP.
        </p>
        <button onClick={onClose} style={{ width:'100%', marginTop:16, padding:'12px 0', borderRadius:14, background:rank.color, color:'#000', fontWeight:700, border:'none' }}>Got it</button>
      </div>
    </div>
  );
}
