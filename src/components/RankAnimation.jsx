import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import RankBadge from './RankBadge.jsx';

function PromoteOverlay({ event, onDone }) {
  const { from, to } = event;
  const [phase, setPhase] = useState('shatter');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 600);
    const t2 = setTimeout(() => confetti({ particleCount:100, spread:70, origin:{x:0.5,y:0.42}, colors:[to.color,to.glow,'#fff'] }), 900);
    const t3 = setTimeout(onDone, 3800);
    return () => [t1,t2,t3].forEach(clearTimeout);
  }, [onDone, to]);

  return (
    <motion.div style={{ position:'fixed', inset:0, zIndex:90, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.9)', backdropFilter:'blur(10px)' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      {phase==='shatter' && <RankBadge rank={from} size="xl" animate={false}/>}
      {phase==='reveal' && (
        <motion.div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}
          initial={{ scale:0.3, opacity:0 }} animate={{ scale:[0.3,1.15,1], opacity:1 }} transition={{ duration:0.5 }}>
          <RankBadge rank={to} size="xl" animate/>
          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:24, fontWeight:700, color:to.color, margin:'8px 0 0' }}>RANK UP</p>
          <p style={{ fontSize:14, color:to.glow }}>{to.tier} {to.sub}</p>
        </motion.div>
      )}
      <button onClick={onDone} style={{ position:'absolute', bottom:40, fontSize:12, color:'rgba(255,255,255,0.3)', background:'none', border:'none' }}>tap to continue</button>
    </motion.div>
  );
}

function DemoteOverlay({ event, onDone }) {
  const { from, to } = event;
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div style={{ position:'fixed', inset:0, zIndex:90, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.92)', backdropFilter:'blur(10px)' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <motion.div animate={{ x:[0,-8,8,-5,5,0] }} transition={{ duration:0.5 }}>
        <div style={{ filter:'saturate(0.5) brightness(0.75)' }}><RankBadge rank={to} size="xl" animate={false}/></div>
      </motion.div>
      <p style={{ fontFamily:"'Space Mono',monospace", fontSize:22, fontWeight:700, color:'#f87171', margin:'10px 0 0' }}>DEMOTED</p>
      <p style={{ fontSize:13, color:'#6b7280' }}>{to.tier} {to.sub}</p>
      <button onClick={onDone} style={{ position:'absolute', bottom:40, fontSize:12, color:'rgba(255,255,255,0.3)', background:'none', border:'none' }}>tap to continue</button>
    </motion.div>
  );
}

export function BonusToast({ events, onDone }) {
  useEffect(() => { if (!events?.length) return; const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [events, onDone]);
  if (!events?.length) return null;
  return (
    <motion.div style={{ position:'fixed', top:0, left:0, right:0, zIndex:80 }} initial={{ y:-60, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:-60, opacity:0 }}>
      {events.map((e,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px',
          background: e.type==='streak_bonus' ? '#0a1f00' : '#1f0000',
          borderBottom:`2px solid ${e.type==='streak_bonus'?'#4ade80':'#f87171'}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>{e.emoji}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color: e.type==='streak_bonus'?'#4ade80':'#f87171' }}>{e.name}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{e.type==='streak_bonus'?`+${e.bonus}`:`−${e.penalty}`} XP</div>
            </div>
          </div>
          <button onClick={onDone} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:16 }}>✕</button>
        </div>
      ))}
    </motion.div>
  );
}

export default function RankAnimation({ animQueue, consumeAnim }) {
  const current = animQueue?.[0];
  return (
    <AnimatePresence>
      {current?.type==='promote' && <PromoteOverlay key="up" event={current} onDone={consumeAnim}/>}
      {current?.type==='demote'  && <DemoteOverlay key="down" event={current} onDone={consumeAnim}/>}
    </AnimatePresence>
  );
}
