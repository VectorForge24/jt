import React, { useState, useEffect } from 'react';
import { ChevronDown, Clock, X, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatStudyTime = (decimalHours) => {
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}.${String(m).padStart(2, '0')} hrs`;
};

const toDec = (timeStr) => {
    if(!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h + m/60;
};

const toTimeStr = (dec) => {
    const h = Math.floor(dec);
    const m = Math.round((dec - h) * 60);
    return `${h > 12 ? h-12 : h === 0 ? 12 : h}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const CurrentDayDot = (props) => {
  const { cx, cy, payload, dataKey } = props;
  if (!payload || payload[dataKey] === null) return null;
  if (payload.isEndDot) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="#ef4444" opacity={0.8}><animate attributeName="r" from="4" to="14" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" /></circle>
        <circle cx={cx} cy={cy} r={5} fill="#ef4444" />
      </g>
    );
  }
  return null;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null; 
  return (<text x={x} y={y} fill="white" fontSize="13" fontWeight="900" textAnchor="middle" dominantBaseline="central">{`${(percent * 100).toFixed(0)}%`}</text>);
};

// Adapted for the current app's shared-state architecture: events and mocks
// now come from appState (the same live source Home/Calendar/Ranking read
// from) instead of a one-time localStorage read on mount. All chart logic,
// math, and JSX below this point is untouched from the original.
export default function ProgressView({ themeToggle, timerIsland, events: rawEventsProp, mocks: mocksProp }) {
  const [currentRenderDate, setCurrentRenderDate] = useState(new Date());
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const currentMonthKey = `${currentRenderDate.getFullYear()}-${String(currentRenderDate.getMonth() + 1).padStart(2, '0')}`;

  const [viewType, setViewType] = useState('Monthly'); 
  const [totalChartType, setTotalChartType] = useState('Line'); 
  const [isTotalChartTypeOpen, setIsTotalChartTypeOpen] = useState(false);
  const [subjectChartType, setSubjectChartType] = useState('Pie'); 
  const [isSubjectChartTypeOpen, setIsSubjectChartTypeOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [totalStats, setTotalStats] = useState({ total: 0, physics: 0, chemistry: 0, math: 0 });
  const [chapterStats, setChapterStats] = useState({ Physics: {}, Chemistry: {}, Mathematics: {} });
  const [activeSubjectPopup, setActiveSubjectPopup] = useState(null);

  // mocks now comes from the live appState prop, not a one-time mount snapshot
  const mocks = mocksProp || [];
  const [activeMockPopup, setActiveMockPopup] = useState(null);

  const SUBJECT_COLORS = { Physics: '#3b82f6', Chemistry: '#10b981', Mathematics: '#8b5cf6' };

  useEffect(() => {
    if (viewType === 'Daily') {
      if (totalChartType === 'Bar') setTotalChartType('Line');
      if (subjectChartType === 'Bar') setSubjectChartType('Line');
    }
  }, [viewType, totalChartType, subjectChartType]);

  useEffect(() => {
    const closeDropdowns = (e) => { 
      if (!e.target.closest('.total-type-drop')) setIsTotalChartTypeOpen(false);
      if (!e.target.closest('.subj-type-drop')) setIsSubjectChartTypeOpen(false);
    };
    document.addEventListener('mousedown', closeDropdowns);
    return () => document.removeEventListener('mousedown', closeDropdowns);
  }, []);

  useEffect(() => {
    const rawEvents = rawEventsProp || [];
    const doneEvents = rawEvents.filter(e => e.done === true || e.extendedProps?.done === true);
    const now = currentRenderDate;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let data = [];
    let stats = { total: 0, physics: 0, chemistry: 0, math: 0 };
    let chapStats = { Physics: {}, Chemistry: {}, Mathematics: {} };

    if (viewType === 'Daily') {
      const todaysTasks = doneEvents.filter(e => e.start && new Date(e.start).toDateString() === now.toDateString())
                                    .sort((a,b) => new Date(a.start) - new Date(b.start));

      data.push({ timeVal: 5, name: '5:00 AM', hours: 0, Physics: 0, Chemistry: 0, Mathematics: 0, isEndDot: false });
      let lastEndDec = 5;

      todaysTasks.forEach((t, i) => {
          const timePartStart = t.start?.includes('T') ? t.start.split('T')[1].substring(0,5) : '00:00';
          const timePartEnd = t.end?.includes('T') ? t.end.split('T')[1].substring(0,5) : '23:59';
          const startDec = toDec(timePartStart);
          const endDec = toDec(timePartEnd);
          const duration = endDec - startDec;
          const subj = t.subject || t.extendedProps?.subject || 'Physics';
          const chapName = t.linkedChapterTitle || t.extendedProps?.linkedChapterTitle || t.title || 'General Tasks';

          if (startDec > lastEndDec || i === 0) {
             data.push({ timeVal: startDec, name: toTimeStr(startDec), hours: 0, Physics: 0, Chemistry: 0, Mathematics: 0, isEndDot: false });
          }

          const isLastTask = i === todaysTasks.length - 1;
          data.push({ 
             timeVal: endDec,
             name: toTimeStr(endDec), 
             hours: Number(duration.toFixed(2)), 
             [subj]: Number(duration.toFixed(2)),
             isEndDot: isLastTask 
          });

          lastEndDec = endDec;
          stats.total += duration;
          stats[subj.toLowerCase().replace('mathematics', 'math')] += duration;
          chapStats[subj][chapName] = (chapStats[subj][chapName] || 0) + duration;
      });

      data.sort((a,b) => a.timeVal - b.timeVal);
      const curDec = new Date().getHours() + new Date().getMinutes()/60;
      if (now.toDateString() === new Date().toDateString()) {
        data.forEach(d => { if(d.timeVal > curDec) { d.hours = null; d.Physics = null; d.Chemistry = null; d.Mathematics = null; } });
      }

    } else {
      const days = viewType === 'Monthly' ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 7;
      let startPoint = new Date(startOfToday);
      if (viewType === 'Weekly') startPoint.setDate(startOfToday.getDate() - startOfToday.getDay());
      else startPoint.setDate(1);

      for (let i = 0; i < days; i++) {
        const d = new Date(startPoint); d.setDate(startPoint.getDate() + i);
        const isFuture = d > new Date();
        data.push({ name: viewType === 'Monthly' ? String(i + 1) : d.toLocaleDateString('en-US', { weekday: 'short' }), dateObj: d, isEndDot: d.toDateString() === new Date().toDateString(), hours: isFuture ? null : 0, Physics: isFuture ? null : 0, Chemistry: isFuture ? null : 0, Mathematics: isFuture ? null : 0 });
      }

      doneEvents.forEach(e => {
        if(!e.start) return;
        const start = new Date(e.start);
        const subj = e.subject || e.extendedProps?.subject || 'Physics';
        const chapName = e.linkedChapterTitle || e.extendedProps?.linkedChapterTitle || e.title || 'General Tasks';
        const durationHrs = (new Date(e.end || e.start) - start) / (1000 * 60 * 60);

        data.forEach(d => {
          if (d.dateObj && d.dateObj.toDateString() === start.toDateString() && d.hours !== null) {
            d.hours += durationHrs; d[subj] += durationHrs;
            stats.total += durationHrs;
            stats[subj.toLowerCase().replace('mathematics', 'math')] += durationHrs;
            chapStats[subj][chapName] = (chapStats[subj][chapName] || 0) + durationHrs;
          }
        });
      });

      data.forEach(d => {
        if (d.hours !== null) {
          const cap = 17;
          if (d.hours > cap) d.hours = cap;
          d.hours = Math.round(d.hours * 10) / 10;
          d.Physics = Math.round(d.Physics * 10) / 10;
          d.Chemistry = Math.round(d.Chemistry * 10) / 10;
          d.Mathematics = Math.round(d.Mathematics * 10) / 10;
        }
      });
    }

    setChartData(data); setTotalStats(stats); setChapterStats(chapStats);
  }, [viewType, currentRenderDate, rawEventsProp, mocksProp]);

  const categorizeMocks = (mocksList, type) => {
     let r=0, y=0, g=0;
     let lists = { Red: [], Yellow: [], Green: [] };
     mocksList.forEach(m => {
         const s = Number(m.score);
         if(type === 'JEE Mains') {
             if(s <= 110) { r++; lists.Red.push(m); }
             else if(s <= 190) { y++; lists.Yellow.push(m); }
             else { g++; lists.Green.push(m); }
         } else {
             if(s <= 120) { r++; lists.Red.push(m); }
             else if(s <= 220) { y++; lists.Yellow.push(m); }
             else { g++; lists.Green.push(m); }
         }
     });
     const data = [
        {name: 'Red', value: r, color: '#ef4444'},
        {name: 'Yellow', value: y, color: '#f59e0b'},
        {name: 'Green', value: g, color: '#10b981'}
     ].filter(d=>d.value>0);
     return { data, lists };
  };

  const monthlyMocks = mocks.filter(m => m.date && m.date.startsWith(currentMonthKey));
  const mainsMocks = monthlyMocks.filter(m => m.type === 'JEE Mains' && m.isCompleted);
  const advMocks = monthlyMocks.filter(m => m.type === 'JEE Advanced' && m.isCompleted);
  const mainsAnalytics = categorizeMocks(mainsMocks, 'JEE Mains');
  const advAnalytics = categorizeMocks(advMocks, 'JEE Advanced');

  const pieData = [
    { name: 'Physics', value: totalStats.physics },
    { name: 'Chemistry', value: totalStats.chemistry },
    { name: 'Mathematics', value: totalStats.math }
  ].filter(d => d.value > 0);

  const daysCount = viewType === 'Daily' ? 1 : viewType === 'Weekly' ? 7 : new Date(currentRenderDate.getFullYear(), currentRenderDate.getMonth() + 1, 0).getDate();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-3 rounded-2xl shadow-xl z-50">
          <p className="text-xs font-bold text-slate-500 mb-2">{viewType === 'Monthly' ? `Day ${label}` : viewType === 'Daily' ? `${label}` : label}</p>
          {payload.map((p, idx) => {
             if(p.value === null) return null;
             return (<p key={idx} className="text-sm font-extrabold" style={{ color: p.color || p.fill || '#3b82f6' }}>{p.name}: {p.value} hrs</p>)
          })}
        </div>
      );
    }
    return null;
  };

  const maxYAxis = viewType === 'Daily' ? 6 : 17;
  const yTicks = viewType === 'Daily' ? [0, 2, 4, 6] : [0, 4, 8, 12, 17];

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl h-full w-full flex flex-col transition-colors duration-300 relative rounded-[32px] shadow-2xl border border-white/20 overflow-hidden mb-2 mr-2">
      
      {activeSubjectPopup && (
        <>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[210] transition-opacity" onClick={() => setActiveSubjectPopup(null)}></div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl absolute top-0 right-0 h-full w-full max-w-[320px] shadow-2xl z-[220] border-l border-white/20 p-6 flex flex-col animate-in slide-in-from-right duration-300 rounded-l-[32px] md:rounded-l-[32px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter" style={{ color: SUBJECT_COLORS[activeSubjectPopup] }}>{activeSubjectPopup}</h3>
              <button onClick={() => setActiveSubjectPopup(null)} className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full"><X size={20} className="text-slate-500"/></button>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Time Studied</p>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{formatStudyTime(totalStats[activeSubjectPopup.toLowerCase().replace('mathematics', 'math')])}</div>
            </div>
            <div className="w-full h-px bg-slate-300/50 dark:bg-slate-700/50 mb-6"></div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chapters Breakdown</p>
              {Object.entries(chapterStats[activeSubjectPopup]).sort((a,b) => b[1] - a[1]).map(([name, hrs]) => (
                <div key={name} className="flex justify-between items-start gap-3 group">
                  <div className="flex gap-2"><span className="text-blue-500 mt-1">•</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">{name}</span></div>
                  <span className="text-xs font-black text-slate-500">{formatStudyTime(hrs)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeMockPopup && (
        <>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[210] transition-opacity" onClick={() => setActiveMockPopup(null)}></div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl absolute top-0 right-0 h-full w-full max-w-[320px] shadow-2xl z-[220] border-l border-white/20 p-6 flex flex-col animate-in slide-in-from-right duration-300 rounded-l-[32px] md:rounded-l-[32px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter" style={{ color: activeMockPopup.color }}>{activeMockPopup.category} Mocks</h3>
              <button onClick={() => setActiveMockPopup(null)} className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full"><X size={20} className="text-slate-500"/></button>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total count</p>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{activeMockPopup.list.length} Tests</div>
            </div>
            <div className="w-full h-px bg-slate-300/50 dark:bg-slate-700/50 mb-6"></div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4">
              {activeMockPopup.list.sort((a,b) => b.score - a.score).map((m, i) => (
                <div key={i} className="flex justify-between items-center bg-white/30 dark:bg-black/20 p-3 rounded-xl border border-white/20">
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{m.name}</span>
                     <span className="text-[10px] font-bold text-slate-500">{m.date}</span>
                  </div>
                  <span className="text-sm font-black px-2 py-1 rounded-md text-white" style={{ backgroundColor: activeMockPopup.color }}>{m.score}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-300/40 dark:border-slate-700/50 shrink-0 relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity bg-white/40 dark:bg-white/10 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/20 dark:border-white/5 shadow-sm" onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}>
              <h2 className="text-[20px] font-extrabold text-slate-800 dark:text-white tracking-tight select-none">
                Progress: {currentRenderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </h2>
              <ChevronDown size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            {isDateDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[190]" onClick={() => setIsDateDropdownOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/20 dark:border-white/10 z-[200] p-2 max-h-[350px] overflow-y-auto hide-scrollbar">
                   {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                      <button key={m} onClick={() => { setCurrentRenderDate(new Date(currentRenderDate.getFullYear(), idx, 1)); setIsDateDropdownOpen(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-[8px] text-sm font-bold transition-colors ${idx === currentRenderDate.getMonth() ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><span>{m} {currentRenderDate.getFullYear()}</span></button>
                   ))}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-1 bg-white/40 dark:bg-white/10 backdrop-blur-md rounded-full p-1 shadow-sm border border-white/20 dark:border-white/5 hidden sm:flex">
            <button onClick={() => setCurrentRenderDate(new Date(currentRenderDate.getFullYear(), currentRenderDate.getMonth() - 1, 1))} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-full transition-colors"><ChevronLeft size={16}/></button>
            <button onClick={() => setCurrentRenderDate(new Date())} className="text-slate-700 dark:text-slate-300 px-3 py-1 text-xs font-bold hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full transition-colors">Today</button>
            <button onClick={() => setCurrentRenderDate(new Date(currentRenderDate.getFullYear(), currentRenderDate.getMonth() + 1, 1))} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-full transition-colors"><ChevronRight size={16}/></button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 transition-all duration-500">
           <div className="relative flex w-full max-w-[280px] bg-slate-300/30 dark:bg-black/30 backdrop-blur-xl p-1.5 rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/5 z-0">
             <div className="absolute top-1.5 bottom-1.5 rounded-full bg-white/90 dark:bg-white/20 shadow-md border border-white/60 dark:border-white/30 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0"
                  style={{ width: 'calc(33.33% - 4px)', transform: `translateX(${['Monthly', 'Weekly', 'Daily'].indexOf(viewType) * 100}%)` }}></div>
             {['Monthly', 'Weekly', 'Daily'].map(v => (
               <button key={v} onClick={() => setViewType(v)} className={`relative flex-1 flex justify-center items-center py-1.5 text-sm z-10 transition-all duration-300 ${viewType === v ? 'text-slate-900 dark:text-white font-black drop-shadow-sm scale-105' : 'text-slate-500/60 dark:text-slate-300/50 font-bold hover:text-slate-600/80 dark:hover:text-slate-300/70'}`}>
                 {v}
               </button>
             ))}
           </div>
           {timerIsland}
           {themeToggle}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6 bg-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-md lg:col-span-1 rounded-[32px] p-6 border-t-4 border-t-blue-500 border border-white/20 shadow-xl flex flex-col justify-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Grind</h3>
            <div className="text-4xl font-black text-slate-800 dark:text-white mb-2">{formatStudyTime(totalStats.total)}</div>
            <div className="text-xs font-bold text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-xl inline-block max-w-max backdrop-blur-sm">Avg: {Math.round((totalStats.total / daysCount) * 10) / 10} hrs / day</div>
          </div>
          
          <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-md lg:col-span-3 rounded-[32px] border border-white/20 shadow-xl p-6 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest">Overall Timeline</h3></div>
              <div className="relative total-type-drop z-50">
                <div className="flex items-center gap-2 cursor-pointer bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm py-1.5 px-3 rounded-xl border border-white/20 shadow-sm" onClick={() => setIsTotalChartTypeOpen(!isTotalChartTypeOpen)}>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">{totalChartType} Chart</h3><ChevronDown size={12} className="text-slate-500" />
                </div>
                {isTotalChartTypeOpen && (
                  <div className="absolute top-full right-0 mt-2 w-28 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 z-[200] p-1">
                    {['Line', ...(viewType !== 'Daily' ? ['Bar'] : [])].map(v => (
                      <button key={v} onClick={() => { setTotalChartType(v); setIsTotalChartTypeOpen(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${totalChartType === v ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>{v} Chart</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              {totalChartType === 'Bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10}/>
                  <YAxis domain={[0, maxYAxis]} ticks={yTicks} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.1 }} />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000} name="Total Hours" />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10}/>
                  <YAxis domain={[0, maxYAxis]} ticks={yTicks} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Line type="linear" dataKey="hours" stroke="#3b82f6" strokeWidth={4} dot={<CurrentDayDot />} activeDot={{ r: 6 }} animationDuration={1000} connectNulls={false}/>
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4">
            {['Physics', 'Chemistry', 'Mathematics'].map(subj => {
              const val = totalStats[subj.toLowerCase().replace('mathematics', 'math')];
              return (
                <div key={subj} className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-3xl p-4 border border-white/20 shadow-xl border-l-4" style={{ borderLeftColor: SUBJECT_COLORS[subj] }}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: SUBJECT_COLORS[subj] }}>{subj}</h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg backdrop-blur-sm">Avg: {Math.round((val / daysCount) * 10) / 10}</span>
                  </div>
                  <div className="text-xl font-black text-slate-800 dark:text-white">{formatStudyTime(val)}</div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-md lg:col-span-3 rounded-[32px] border border-white/20 shadow-xl p-6 flex flex-col min-h-[300px] relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest">Subject Split</h3></div>
              <div className="relative subj-type-drop z-50">
                <div className="flex items-center gap-2 cursor-pointer bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm py-1.5 px-3 rounded-xl border border-white/20 shadow-sm" onClick={() => setIsSubjectChartTypeOpen(!isSubjectChartTypeOpen)}>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">{subjectChartType} Chart</h3><ChevronDown size={12} className="text-slate-500" />
                </div>
                {isSubjectChartTypeOpen && (
                  <div className="absolute top-full right-0 mt-2 w-28 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 z-[200] p-1">
                    {['Line', 'Pie', ...(viewType !== 'Daily' ? ['Bar'] : [])].map(v => (
                      <button key={v} onClick={() => { setSubjectChartType(v); setIsSubjectChartTypeOpen(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${subjectChartType === v ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>{v} Chart</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 w-full min-h-[250px] flex justify-center items-center">
              {subjectChartType === 'Pie' ? (
                pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel} onClick={(data) => setActiveSubjectPopup(data.name)} cursor="pointer">
                        {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.name]} opacity={activeSubjectPopup ? (activeSubjectPopup === entry.name ? 1 : 0.2) : 1} style={{ transition: 'opacity 0.3s ease' }}/>))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (<div className="text-slate-500 font-bold text-sm">No data to display.</div>)
              ) : subjectChartType === 'Bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10}/>
                    <YAxis domain={[0, maxYAxis]} ticks={yTicks} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.1 }} />
                    <Bar dataKey="Physics" stackId="a" fill={SUBJECT_COLORS.Physics} animationDuration={1000} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Chemistry" stackId="a" fill={SUBJECT_COLORS.Chemistry} animationDuration={1000} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Mathematics" stackId="a" fill={SUBJECT_COLORS.Mathematics} radius={[4, 4, 0, 0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10}/>
                    <YAxis domain={[0, maxYAxis]} ticks={yTicks} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line type="linear" dataKey="Physics" stroke={SUBJECT_COLORS.Physics} strokeWidth={3} dot={<CurrentDayDot dataKey="Physics" />} activeDot={{ r: 6 }} animationDuration={1000} connectNulls={false}/>
                    <Line type="linear" dataKey="Chemistry" stroke={SUBJECT_COLORS.Chemistry} strokeWidth={3} dot={<CurrentDayDot dataKey="Chemistry" />} activeDot={{ r: 6 }} animationDuration={1000} connectNulls={false}/>
                    <Line type="linear" dataKey="Mathematics" stroke={SUBJECT_COLORS.Mathematics} strokeWidth={3} dot={<CurrentDayDot dataKey="Mathematics" />} activeDot={{ r: 6 }} animationDuration={1000} connectNulls={false}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl p-6 mt-6">
            <div className="flex items-center gap-2 mb-6"><Target size={16} className="text-red-500 fill-red-500" /><h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-widest">Mock Test Analytics</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               
               <div className="flex flex-col items-center bg-white/10 dark:bg-black/10 rounded-2xl p-4 border border-white/10">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">JEE Mains</h4>
                  {mainsMocks.length > 0 ? (
                     <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={mainsAnalytics.data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel} onClick={(data) => setActiveMockPopup({ category: 'JEE Mains', color: data.color, list: mainsAnalytics.lists[data.name] })} cursor="pointer">
                            {mainsAnalytics.data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }}/>))}
                          </Pie>
                          <Tooltip content={<div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white">Click to view mocks</div>} />
                        </PieChart>
                     </ResponsiveContainer>
                  ) : <div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400">No completed mocks this month.</div>}
               </div>

               <div className="flex flex-col items-center bg-white/10 dark:bg-black/10 rounded-2xl p-4 border border-white/10">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">JEE Advanced</h4>
                  {advMocks.length > 0 ? (
                     <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={advAnalytics.data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel} onClick={(data) => setActiveMockPopup({ category: 'JEE Advanced', color: data.color, list: advAnalytics.lists[data.name] })} cursor="pointer">
                            {advAnalytics.data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }}/>))}
                          </Pie>
                          <Tooltip content={<div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white">Click to view mocks</div>} />
                        </PieChart>
                     </ResponsiveContainer>
                  ) : <div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400">No completed mocks this month.</div>}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
