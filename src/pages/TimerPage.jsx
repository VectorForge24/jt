import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, BrainCircuit, Timer as TimerIcon, Clock } from 'lucide-react';

const fmt = (s, showHrs=false) => {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  if (showHrs||h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

// TimerPage no longer owns any timer state — it's all lifted into
// useGlobalTimer() at the App.jsx level so the timer survives page
// navigation. This page just reads and controls that shared instance.
export default function TimerPage({ timer }) {
  const { mode, pomoType, timeLeft, totalTime, isRunning, countdownInput, isDone, progress,
    changeMode, changePomoType, changeCountdownInput, toggle, reset } = timer;

  const showPicker = mode==='Countdown' && !isRunning && timeLeft===totalTime && !isDone;
  const ringR = 130, ringCirc = 2*Math.PI*ringR;

  return (
    <div style={{ paddingBottom:90, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 16px 90px' }}>

      <div style={{ display:'flex', gap:4, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:99, padding:4, width:'100%', maxWidth:320 }}>
        {[['Pomodoro',BrainCircuit],['Stopwatch',TimerIcon],['Countdown',Clock]].map(([m,Icon]) => (
          <button key={m} onClick={() => changeMode(m)}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'9px 0', borderRadius:99, fontSize:11, fontWeight:700,
              background: mode===m ? 'rgba(255,255,255,0.1)' : 'transparent', color: mode===m ? '#fff' : '#64748b', border:'none' }}>
            <Icon size={13}/>{m}
          </button>
        ))}
      </div>

      {mode==='Pomodoro' && (
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
          {['Focus','Short','Long'].map(t => (
            <button key={t} onClick={() => changePomoType(t)}
              style={{ padding:'8px 16px', borderRadius:99, fontSize:12, fontWeight:700,
                background: pomoType===t ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${pomoType===t?'#3b82f6':'rgba(255,255,255,0.06)'}`,
                color: pomoType===t ? '#60a5fa' : '#64748b' }}>
              {t==='Focus'?'Deep Work':t==='Short'?'Short Break':'Long Break'}
            </button>
          ))}
        </div>
      )}

      <div style={{ position:'relative', width:280, height:280, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:32 }}>
        {!showPicker && mode!=='Stopwatch' && (
          <svg width="280" height="280" style={{ position:'absolute', transform:'rotate(-90deg)' }}>
            <circle cx="140" cy="140" r={ringR} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="3"/>
            <circle cx="140" cy="140" r={ringR} fill="none" stroke={isDone?'#ef4444':'#3b82f6'} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={ringCirc} strokeDashoffset={ringCirc-(progress/100)*ringCirc}
              style={{ transition:'stroke-dashoffset 1s linear' }}/>
          </svg>
        )}

        {showPicker ? (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <ScrollPicker max={5} value={countdownInput.h} onChange={v => changeCountdownInput(v,countdownInput.m,countdownInput.s)} label="H"/>
            <span style={{ fontSize:20, color:'#475569' }}>:</span>
            <ScrollPicker max={59} value={countdownInput.m} onChange={v => changeCountdownInput(countdownInput.h,v,countdownInput.s)} label="M"/>
            <span style={{ fontSize:20, color:'#475569' }}>:</span>
            <ScrollPicker max={59} value={countdownInput.s} onChange={v => changeCountdownInput(countdownInput.h,countdownInput.m,v)} label="S"/>
          </div>
        ) : (
          <div style={{ fontSize:56, fontWeight:800, color: isDone?'#ef4444':'#f1f5f9', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.02em' }}>
            {fmt(timeLeft, mode!=='Pomodoro')}
          </div>
        )}
      </div>

      <p style={{ fontSize:12, fontWeight:700, color: isDone?'#ef4444':'#64748b', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:32 }}>
        {mode==='Stopwatch' ? 'Elapsed' : isDone ? "Time's up!" : isRunning ? 'Focusing…' : 'Ready'}
      </p>

      <div style={{ display:'flex', alignItems:'center', gap:24 }}>
        <button onClick={reset} style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RotateCcw size={18} color="#94a3b8"/>
        </button>
        <button onClick={toggle}
          style={{ width:76, height:76, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center',
            background: isRunning ? '#f59e0b' : '#3b82f6', boxShadow: `0 6px 24px ${isRunning?'#f59e0b':'#3b82f6'}55` }}>
          {isRunning ? <Pause size={26} color="#fff" fill="#fff"/> : <Play size={26} color="#fff" fill="#fff" style={{ marginLeft:3 }}/>}
        </button>
        <div style={{ width:48 }}/>
      </div>
    </div>
  );
}

function ScrollPicker({ max, value, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = value*40; }, []);
  const onScroll = e => { const v = Math.round(e.target.scrollTop/40); if (v>=0 && v<=max) onChange(v); };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div ref={ref} onScroll={onScroll} className="hide-scrollbar"
        style={{ height:120, width:56, overflowY:'auto', scrollSnapType:'y mandatory', background:'rgba(255,255,255,0.03)', borderRadius:14 }}>
        <div style={{ height:40 }}/>
        {Array.from({ length:max+1 }).map((_,i) => (
          <div key={i} style={{ height:40, display:'flex', alignItems:'center', justifyContent:'center', scrollSnapAlign:'center',
            fontSize:20, fontWeight:800, color: value===i ? '#3b82f6' : '#475569' }}>
            {String(i).padStart(2,'0')}
          </div>
        ))}
        <div style={{ height:40 }}/>
      </div>
    </div>
  );
}
