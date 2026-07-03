import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X } from 'lucide-react';

const fmt = (s, showHrs=false) => {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  if (showHrs||h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

/**
 * DynamicIsland — persistent timer pill, styled after iOS's Dynamic Island.
 *
 * Collapsed: a small circle showing time remaining, with a progress ring
 * filling around its edge as the timer counts down.
 * Expanded (tap to open): full-width pill with progress bar, pause/resume,
 * reset, and a close (minimize) button. Framer Motion's layout animation
 * handles the shape morph smoothly between the two states.
 */
export default function DynamicIsland({ timer, themeHex = '#3b82f6' }) {
  const [expanded, setExpanded] = useState(false);
  const { mode, timeLeft, totalTime, isRunning, isDone, progress, isActive, toggle, reset } = timer;

  if (!isActive) return null;

  const ringR = 15, ringCirc = 2 * Math.PI * ringR;
  const color = isDone ? '#ef4444' : themeHex;

  return (
    <motion.div
      layout
      onClick={() => !expanded && setExpanded(true)}
      transition={{ type:'spring', stiffness:400, damping:32 }}
      style={{
        position:'relative', overflow:'hidden', cursor: expanded ? 'default' : 'pointer',
        background:'#000', border:'1px solid rgba(255,255,255,0.08)',
        boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
      }}
      animate={{
        width: expanded ? 280 : 40,
        height: expanded ? 92 : 40,
        borderRadius: expanded ? 24 : 20,
      }}
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          // ── Collapsed: circle with progress ring ──────────────────────────
          <motion.div key="collapsed" style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>
            <svg width="40" height="40" style={{ position:'absolute', transform:'rotate(-90deg)' }}>
              <circle cx="20" cy="20" r={ringR} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5"/>
              <circle cx="20" cy="20" r={ringR} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={ringCirc} strokeDashoffset={ringCirc - (mode==='Stopwatch' ? 0 : (progress/100)) * ringCirc}
                style={{ transition:'stroke-dashoffset 1s linear' }}/>
            </svg>
            {isRunning && (
              <motion.div style={{ position:'absolute', width:6, height:6, borderRadius:'50%', background:color, top:5, right:9 }}
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.5, repeat:Infinity }}/>
            )}
          </motion.div>
        ) : (
          // ── Expanded: full controls ────────────────────────────────────────
          <motion.div key="expanded" style={{ position:'absolute', inset:0, padding:'12px 16px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15, delay:0.1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:10, fontWeight:700, color: isDone?'#f87171':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {isDone ? "Time's up!" : mode}
              </span>
              <button onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                style={{ background:'none', border:'none', padding:2, display:'flex' }}>
                <X size={13} color="#64748b"/>
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22, fontWeight:800, color:'#fff', fontVariantNumeric:'tabular-nums', minWidth:76 }}>
                {fmt(timeLeft, mode!=='Pomodoro')}
              </span>
              <div style={{ flex:1, height:5, borderRadius:99, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
                <motion.div style={{ height:'100%', borderRadius:99, background:color }}
                  animate={{ width: mode==='Stopwatch' ? '100%' : `${progress}%` }} transition={{ duration:0.8, ease:'linear' }}/>
              </div>
              <button onClick={(e) => { e.stopPropagation(); reset(); }}
                style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <RotateCcw size={12} color="#94a3b8"/>
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggle(); }}
                style={{ width:32, height:32, borderRadius:'50%', background:color, border:'none', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {isRunning ? <Pause size={14} color="#fff" fill="#fff"/> : <Play size={14} color="#fff" fill="#fff" style={{ marginLeft:1 }}/>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
