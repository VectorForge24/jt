import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, BrainCircuit, Clock } from 'lucide-react';

const fmtTime = (totalSec, showHrs=false) => {
  const h=Math.floor(totalSec/3600), m=Math.floor((totalSec%3600)/60), s=totalSec%60;
  if (showHrs||h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const ScrollPicker = ({ max, value, onChange, label }) => {
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop = value*48; }, []);
  const onScroll = e => { const v=Math.round(e.target.scrollTop/48); if(v>=0&&v<=max) onChange(v); };
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-extrabold tracking-widest text-slate-400 mb-2 uppercase">{label}</span>
      <div ref={ref} onScroll={onScroll}
        className="h-[144px] w-[72px] md:w-20 bg-white/15 dark:bg-white/5 rounded-2xl overflow-y-auto snap-y snap-mandatory relative shadow-inner border border-white/20 dark:border-white/8 backdrop-blur-md hide-scrollbar">
        <div className="h-[48px]"/>
        {Array.from({length:max+1}).map((_,i)=>(
          <div key={i} className={`h-[48px] flex items-center justify-center snap-center text-2xl font-black transition-colors ${value===i?'text-blue-500 dark:text-blue-400':'text-slate-400 dark:text-slate-500'}`}>
            {String(i).padStart(2,'0')}
          </div>
        ))}
        <div className="h-[48px]"/>
      </div>
    </div>
  );
};

export default function TimerView({ themeToggle, timerMode, setTimerMode, pomodoroType, setPomodoroType, timeLeft, setTimeLeft, totalTime, setTotalTime, isRunning, setIsRunning }) {
  const [inH,setInH]=useState(0), [inM,setInM]=useState(0), [inS,setInS]=useState(0);

  useEffect(()=>{ if(timerMode==='Countdown'){ setInH(Math.floor(totalTime/3600)); setInM(Math.floor((totalTime%3600)/60)); setInS(totalTime%60); } }, []);

  const changeMode = mode => {
    if (timerMode===mode) return;
    setIsRunning(false); setTimerMode(mode);
    if (mode==='Pomodoro') { const t=pomodoroType==='Focus'?1500:pomodoroType==='Short'?300:900; setTimeLeft(t); setTotalTime(t); }
    else if (mode==='Stopwatch') { setTimeLeft(0); setTotalTime(0); }
    else if (mode==='Countdown') { const t=inH*3600+inM*60+inS; setTimeLeft(t); setTotalTime(t); }
  };

  const changePomodoro = type => {
    if (pomodoroType===type) return;
    setIsRunning(false); setPomodoroType(type);
    const t=type==='Focus'?1500:type==='Short'?300:900; setTimeLeft(t); setTotalTime(t);
  };

  const changeScroll = (type,val) => {
    let h=inH,m=inM,s=inS;
    if(type==='H'){setInH(val);h=val;} if(type==='M'){setInM(val);m=val;} if(type==='S'){setInS(val);s=val;}
    if (timerMode==='Countdown'&&!isRunning) { const nt=h*3600+m*60+s; setTimeLeft(nt); setTotalTime(nt); }
  };

  const toggle = () => { if(timerMode==='Countdown'&&timeLeft===0) return; setIsRunning(!isRunning); };
  const reset  = () => {
    setIsRunning(false);
    if (timerMode==='Pomodoro') setTimeLeft(pomodoroType==='Focus'?1500:pomodoroType==='Short'?300:900);
    else if (timerMode==='Stopwatch') setTimeLeft(0);
    else setTimeLeft(totalTime);
  };

  const isDone   = timeLeft===0 && !isRunning && totalTime>0 && timerMode!=='Stopwatch';
  const showPick = timerMode==='Countdown' && !isRunning && !isDone && timeLeft===totalTime;
  const progress = timerMode==='Stopwatch' ? 0 : totalTime ? ((totalTime-timeLeft)/totalTime)*100 : 0;

  return (
    <div className="glass-card w-full flex flex-col relative rounded-[28px] shadow-2xl mb-2 mr-2 overflow-hidden" style={{minHeight:'calc(100vh - 80px)'}}>

      <div className="flex justify-between items-center px-5 py-3 border-b border-white/15 dark:border-white/5 shrink-0">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Focus Timer</h2>
        {themeToggle}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center relative">

        {/* Mode switcher */}
        <div className="relative flex w-full max-w-[320px] bg-slate-200/40 dark:bg-black/25 p-1 rounded-full border border-white/15 dark:border-white/5 mb-7">
          <div className="absolute top-1 bottom-1 rounded-full bg-white/90 dark:bg-white/20 shadow border border-white/50 dark:border-white/15 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{width:'calc(33.33% - 3px)',transform:`translateX(${['Pomodoro','Stopwatch','Countdown'].indexOf(timerMode)*100}%)`}}/>
          {['Pomodoro','Stopwatch','Countdown'].map(mode=>(
            <button key={mode} onClick={()=>changeMode(mode)}
              className={`relative flex-1 flex justify-center items-center gap-1 py-2 text-xs z-10 transition-all ${timerMode===mode?'text-slate-900 dark:text-white font-black':'text-slate-500 dark:text-slate-400 font-bold'}`}>
              {mode==='Pomodoro'?<BrainCircuit size={14}/>:mode==='Stopwatch'?<TimerIcon size={14}/>:<Clock size={14}/>}
              {mode}
            </button>
          ))}
        </div>

        {/* Pomodoro sub-type */}
        {timerMode==='Pomodoro' && (
          <div className="flex gap-2 mb-7 flex-wrap justify-center">
            {['Focus','Short','Long'].map(type=>(
              <button key={type} onClick={()=>changePomodoro(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all
                  ${pomodoroType===type?'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 scale-105':'bg-white/15 dark:bg-white/4 text-slate-600 dark:text-slate-400 border-white/15 dark:border-white/8 hover:bg-white/25'}`}>
                {type==='Focus'?'Deep Work':type==='Short'?'Short Break':'Long Break'}
              </button>
            ))}
          </div>
        )}

        {/* Main timer */}
        <div className="flex-1 flex flex-col justify-center items-center w-full relative mb-10">
          {/* Ambient glow */}
          <div className={`absolute w-72 h-72 md:w-96 md:h-96 rounded-full blur-[90px] transition-all duration-1000 pointer-events-none
            ${isRunning?'bg-blue-500 opacity-25':isDone?'bg-red-500 opacity-25':'opacity-0'}`}/>

          {/* Progress ring background */}
          {!showPick && timerMode!=='Stopwatch' && (
            <svg className="absolute" width="320" height="320" style={{transform:'rotate(-90deg)'}}>
              <circle cx="160" cy="160" r="148" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="3"/>
              <circle cx="160" cy="160" r="148" fill="none"
                stroke={isDone?'#ef4444':'#3b82f6'} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={2*Math.PI*148}
                strokeDashoffset={2*Math.PI*148 - (progress/100)*2*Math.PI*148}
                style={{transition:'stroke-dashoffset 1s linear'}}/>
            </svg>
          )}

          {showPick ? (
            <div className="relative z-10 flex items-center gap-1.5 md:gap-3">
              <ScrollPicker max={24} value={inH} onChange={v=>changeScroll('H',v)} label="Hours"/>
              <span className="text-2xl font-black text-slate-400 dark:text-slate-600 pb-2">:</span>
              <ScrollPicker max={59} value={inM} onChange={v=>changeScroll('M',v)} label="Minutes"/>
              <span className="text-2xl font-black text-slate-400 dark:text-slate-600 pb-2">:</span>
              <ScrollPicker max={59} value={inS} onChange={v=>changeScroll('S',v)} label="Seconds"/>
            </div>
          ) : (
            <div className={`relative z-10 text-[4.2rem] md:text-[7rem] font-black tabular-nums tracking-tighter leading-none transition-colors duration-500
              ${isDone?'text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.45)]':'text-slate-800 dark:text-white'}`}>
              {fmtTime(timeLeft, timerMode==='Stopwatch'||timerMode==='Countdown'||timeLeft>=3600)}
            </div>
          )}

          <p className={`text-xs font-bold mt-7 uppercase tracking-[0.25em] z-10 transition-colors duration-500 ${isDone?'text-red-500':'text-slate-500 dark:text-slate-400'}`}>
            {timerMode==='Stopwatch'?'Elapsed Time':isDone?(timerMode==='Countdown'?"Time's up!":'Grind Complete'):isRunning?'Focusing…':'Time Remaining'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 md:gap-7 pb-10 z-10">
          <button onClick={reset}
            className="bg-white/30 dark:bg-white/6 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform shadow-md border border-white/20 dark:border-white/8">
            <RotateCcw size={20}/>
          </button>
          <button onClick={toggle}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 border border-white/20
              ${isRunning?'bg-amber-500 text-white shadow-amber-500/40':'bg-blue-600 text-white shadow-blue-600/40'}`}>
            {isRunning?<Pause size={30} fill="currentColor"/>:<Play size={30} fill="currentColor" className="ml-1"/>}
          </button>
          <div className="w-12 h-12"/>
        </div>
      </div>
    </div>
  );
}
