import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmtHrs = d => { const h=Math.floor(Math.round(d*60)/60), m=Math.round(d*60)%60; return `${h}.${String(m).padStart(2,'0')} hrs`; };
const toDec  = s => { if(!s)return 0; const[h,m]=s.split(':').map(Number); return h+m/60; };
const toTime = d => { const h=Math.floor(d), m=Math.round((d-h)*60); return `${h>12?h-12:h===0?12:h}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; };

const EndDot = props => {
  const {cx,cy,payload,dataKey} = props;
  if (!payload||payload[dataKey]===null) return null;
  if (!payload.isEndDot) return null;
  return (<g><circle cx={cx} cy={cy} r={4} fill="#ef4444" opacity={0.8}><animate attributeName="r" from="4" to="14" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite"/></circle><circle cx={cx} cy={cy} r={5} fill="#ef4444"/></g>);
};

const PieLabel = ({cx,cy,midAngle,innerRadius,outerRadius,percent}) => {
  if(percent<0.05) return null;
  const R=Math.PI/180, r=innerRadius+(outerRadius-innerRadius)*0.5;
  return <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)} fill="white" fontSize="13" fontWeight="900" textAnchor="middle" dominantBaseline="central">{`${(percent*100).toFixed(0)}%`}</text>;
};

const SC = { Physics:'#3b82f6', Chemistry:'#10b981', Mathematics:'#8b5cf6' };

export default function ProgressView({ themeToggle, timerIsland }) {
  const [renderDate,  setRenderDate]  = useState(new Date());
  const [dateOpen,    setDateOpen]    = useState(false);
  const [viewType,    setViewType]    = useState('Monthly');
  const [totalChart,  setTotalChart]  = useState('Line');
  const [totalOpen,   setTotalOpen]   = useState(false);
  const [subjChart,   setSubjChart]   = useState('Pie');
  const [subjOpen,    setSubjOpen]    = useState(false);
  const [chartData,   setChartData]   = useState([]);
  const [stats,       setStats]       = useState({total:0,physics:0,chemistry:0,math:0});
  const [chapStats,   setChapStats]   = useState({Physics:{},Chemistry:{},Mathematics:{}});
  const [subjPopup,   setSubjPopup]   = useState(null);
  const [mockPopup,   setMockPopup]   = useState(null);
  const [mocks]                       = useState(()=>JSON.parse(localStorage.getItem('tracker-mocks')||'[]'));

  const mk = `${renderDate.getFullYear()}-${String(renderDate.getMonth()+1).padStart(2,'0')}`;

  useEffect(()=>{ if(viewType==='Daily'&&totalChart==='Bar')setTotalChart('Line'); if(viewType==='Daily'&&subjChart==='Bar')setSubjChart('Line'); },[viewType]);
  useEffect(()=>{ const c=e=>{if(!e.target.closest('.td'))setTotalOpen(false);if(!e.target.closest('.sd'))setSubjOpen(false);}; document.addEventListener('mousedown',c); return()=>document.removeEventListener('mousedown',c); },[]);

  useEffect(()=>{
    const raw=JSON.parse(localStorage.getItem('tracker-events')||'[]');
    const done=raw.filter(e=>e.done===true||e.extendedProps?.done===true);
    const now=renderDate, sot=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    let data=[], st={total:0,physics:0,chemistry:0,math:0}, cs={Physics:{},Chemistry:{},Mathematics:{}};

    if(viewType==='Daily'){
      const td=done.filter(e=>e.start&&new Date(e.start).toDateString()===now.toDateString()).sort((a,b)=>new Date(a.start)-new Date(b.start));
      data.push({timeVal:5,name:'5:00 AM',hours:0,Physics:0,Chemistry:0,Mathematics:0,isEndDot:false});
      let last=5;
      td.forEach((t,i)=>{
        const ts=t.start?.includes('T')?t.start.split('T')[1].substring(0,5):'00:00';
        const te=t.end?.includes('T')?t.end.split('T')[1].substring(0,5):'23:59';
        const sd=toDec(ts),ed=toDec(te),dur=ed-sd;
        const subj=t.subject||t.extendedProps?.subject||'Physics';
        const chap=t.linkedChapterTitle||t.extendedProps?.linkedChapterTitle||t.title||'General';
        if(sd>last||i===0)data.push({timeVal:sd,name:toTime(sd),hours:0,Physics:0,Chemistry:0,Mathematics:0,isEndDot:false});
        data.push({timeVal:ed,name:toTime(ed),hours:Number(dur.toFixed(2)),[subj]:Number(dur.toFixed(2)),isEndDot:i===td.length-1});
        last=ed; st.total+=dur; st[subj.toLowerCase().replace('mathematics','math')]+=dur; cs[subj][chap]=(cs[subj][chap]||0)+dur;
      });
      data.sort((a,b)=>a.timeVal-b.timeVal);
      if(now.toDateString()===new Date().toDateString()){const cur=new Date().getHours()+new Date().getMinutes()/60;data.forEach(d=>{if(d.timeVal>cur){d.hours=null;d.Physics=null;d.Chemistry=null;d.Mathematics=null;}});}
    } else {
      const days=viewType==='Monthly'?new Date(now.getFullYear(),now.getMonth()+1,0).getDate():7;
      let sp=new Date(sot);
      if(viewType==='Weekly')sp.setDate(sot.getDate()-sot.getDay()); else sp.setDate(1);
      for(let i=0;i<days;i++){
        const d=new Date(sp); d.setDate(sp.getDate()+i);
        const fut=d>new Date();
        data.push({name:viewType==='Monthly'?String(i+1):d.toLocaleDateString('en-US',{weekday:'short'}),dateObj:d,isEndDot:d.toDateString()===new Date().toDateString(),hours:fut?null:0,Physics:fut?null:0,Chemistry:fut?null:0,Mathematics:fut?null:0});
      }
      done.forEach(e=>{
        if(!e.start)return;
        const s=new Date(e.start), subj=e.subject||e.extendedProps?.subject||'Physics';
        const chap=e.linkedChapterTitle||e.extendedProps?.linkedChapterTitle||e.title||'General';
        const dur=(new Date(e.end||e.start)-s)/3600000;
        data.forEach(d=>{if(d.dateObj&&d.dateObj.toDateString()===s.toDateString()&&d.hours!==null){d.hours+=dur;d[subj]+=dur;st.total+=dur;st[subj.toLowerCase().replace('mathematics','math')]+=dur;cs[subj][chap]=(cs[subj][chap]||0)+dur;}});
      });
      data.forEach(d=>{if(d.hours!==null){d.hours=Math.round(Math.min(d.hours,17)*10)/10;d.Physics=Math.round(d.Physics*10)/10;d.Chemistry=Math.round(d.Chemistry*10)/10;d.Mathematics=Math.round(d.Mathematics*10)/10;}});
    }
    setChartData(data); setStats(st); setChapStats(cs);
  },[viewType,renderDate]);

  const days=viewType==='Daily'?1:viewType==='Weekly'?7:new Date(renderDate.getFullYear(),renderDate.getMonth()+1,0).getDate();
  const maxY=viewType==='Daily'?6:17, yTicks=viewType==='Daily'?[0,2,4,6]:[0,4,8,12,17];
  const pieData=[{name:'Physics',value:stats.physics},{name:'Chemistry',value:stats.chemistry},{name:'Mathematics',value:stats.math}].filter(d=>d.value>0);

  const categorizeMocks = (list,type) => {
    let r=0,y=0,g=0,L={Red:[],Yellow:[],Green:[]};
    list.forEach(m=>{const s=Number(m.score);const isM=type==='JEE Mains';if((isM&&s<=110)||(!isM&&s<=120)){r++;L.Red.push(m);}else if((isM&&s<=190)||(!isM&&s<=220)){y++;L.Yellow.push(m);}else{g++;L.Green.push(m);}});
    return{data:[{name:'Red',value:r,color:'#ef4444'},{name:'Yellow',value:y,color:'#f59e0b'},{name:'Green',value:g,color:'#10b981'}].filter(d=>d.value>0),lists:L};
  };

  const monthMocks=mocks.filter(m=>m.date&&m.date.startsWith(mk));
  const mains=monthMocks.filter(m=>m.type==='JEE Mains'&&m.isCompleted);
  const adv=monthMocks.filter(m=>m.type==='JEE Advanced'&&m.isCompleted);
  const mainsA=categorizeMocks(mains,'JEE Mains'), advA=categorizeMocks(adv,'JEE Advanced');

  const Tip = ({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    return(<div className="bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl border border-white/20 dark:border-white/10 p-3 rounded-2xl shadow-xl">
      <p className="text-[10px] font-bold text-slate-500 mb-1.5">{viewType==='Monthly'?`Day ${label}`:label}</p>
      {payload.map((p,i)=>p.value!==null&&<p key={i} className="text-xs font-extrabold" style={{color:p.color||p.fill||'#3b82f6'}}>{p.name}: {p.value} hrs</p>)}
    </div>);
  };

  const ChartDD = ({label,value,opts,isOpen,setOpen,onChange,cls}) => (
    <div className={`relative ${cls}`}>
      <div className="flex items-center gap-1.5 cursor-pointer bg-white/30 dark:bg-white/6 py-1.5 px-3 rounded-xl border border-white/20 dark:border-white/8 text-xs font-bold text-slate-700 dark:text-slate-300" onClick={()=>setOpen(!isOpen)}>
        {value} Chart <ChevronDown size={11} className="text-slate-500"/>
      </div>
      {isOpen&&<div className="absolute top-full right-0 mt-1.5 w-28 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1">
        {opts.map(v=><button key={v} onClick={()=>{onChange(v);setOpen(false);}} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${value===v?'bg-blue-500/15 text-blue-600 dark:text-blue-400':'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{v} Chart</button>)}
      </div>}
    </div>
  );

  const Card = ({children,className=''}) => (
    <div className={`bg-white/25 dark:bg-white/4 backdrop-blur-md rounded-[24px] border border-white/20 dark:border-white/6 shadow-lg ${className}`}>{children}</div>
  );

  return (
    <div className="glass-card w-full flex flex-col relative rounded-[28px] shadow-2xl mb-2 mr-2 overflow-hidden" style={{minHeight:'calc(100vh - 80px)'}}>

      {/* Subject slide-out panel */}
      {subjPopup&&(<>
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-[210]" onClick={()=>setSubjPopup(null)}/>
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl absolute top-0 right-0 h-full w-72 shadow-2xl z-[220] border-l border-white/20 p-6 flex flex-col rounded-l-[28px]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-black uppercase tracking-tight" style={{color:SC[subjPopup]}}>{subjPopup}</h3>
            <button onClick={()=>setSubjPopup(null)} className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full"><X size={18} className="text-slate-500"/></button>
          </div>
          <div className="mb-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Time Studied</p>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{fmtHrs(stats[subjPopup.toLowerCase().replace('mathematics','math')])}</div>
          </div>
          <div className="h-px bg-slate-200/50 dark:bg-white/8 mb-5"/>
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chapters</p>
            {Object.entries(chapStats[subjPopup]).sort((a,b)=>b[1]-a[1]).map(([name,hrs])=>(
              <div key={name} className="flex justify-between items-start gap-3">
                <div className="flex gap-2"><span style={{color:SC[subjPopup]}} className="mt-1">•</span><span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{name}</span></div>
                <span className="text-[10px] font-black text-slate-500 flex-shrink-0">{fmtHrs(hrs)}</span>
              </div>
            ))}
          </div>
        </div>
      </>)}

      {/* Mock slide-out panel */}
      {mockPopup&&(<>
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-[210]" onClick={()=>setMockPopup(null)}/>
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl absolute top-0 right-0 h-full w-72 shadow-2xl z-[220] border-l border-white/20 p-6 flex flex-col rounded-l-[28px]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-black uppercase tracking-tight" style={{color:mockPopup.color}}>{mockPopup.category}</h3>
            <button onClick={()=>setMockPopup(null)} className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full"><X size={18} className="text-slate-500"/></button>
          </div>
          <div className="mb-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Count</p>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{mockPopup.list.length} Tests</div>
          </div>
          <div className="h-px bg-slate-200/50 dark:bg-white/8 mb-5"/>
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
            {mockPopup.list.sort((a,b)=>b.score-a.score).map((m,i)=>(
              <div key={i} className="flex justify-between items-center bg-white/30 dark:bg-black/20 p-3 rounded-xl border border-white/20">
                <div><div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{m.name}</div><div className="text-[9px] font-semibold text-slate-500 mt-0.5">{m.date}</div></div>
                <span className="text-xs font-black px-2 py-0.5 rounded-lg text-white" style={{backgroundColor:mockPopup.color}}>{m.score}</span>
              </div>
            ))}
          </div>
        </div>
      </>)}

      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-white/15 dark:border-white/5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Date dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 bg-white/35 dark:bg-white/6 py-1.5 px-3 rounded-full border border-white/25 dark:border-white/8"
              onClick={()=>setDateOpen(!dateOpen)}>
              <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                Progress: {renderDate.toLocaleDateString('en-US',{month:'short',year:'numeric'})}
              </h2>
              <ChevronDown size={14} className="text-slate-500"/>
            </div>
            {dateOpen&&(<>
              <div className="fixed inset-0 z-[190]" onClick={()=>setDateOpen(false)}/>
              <div className="absolute top-full left-0 mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[200] p-1.5 max-h-[300px] overflow-y-auto hide-scrollbar">
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>(
                  <button key={m} onClick={()=>{setRenderDate(new Date(renderDate.getFullYear(),i,1));setDateOpen(false);}}
                    className={`flex w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${i===renderDate.getMonth()?'bg-blue-500/15 text-blue-600 dark:text-blue-400':'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    {m} {renderDate.getFullYear()}
                  </button>
                ))}
              </div>
            </>)}
          </div>
          {/* Nav arrows */}
          <div className="flex gap-0.5 bg-white/25 dark:bg-white/5 rounded-full p-0.5 border border-white/15 dark:border-white/5">
            <button onClick={()=>setRenderDate(new Date(renderDate.getFullYear(),renderDate.getMonth()-1,1))} className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 transition-colors text-sm font-bold">‹</button>
            <button onClick={()=>setRenderDate(new Date())} className="px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white/40 rounded-full transition-colors">Today</button>
            <button onClick={()=>setRenderDate(new Date(renderDate.getFullYear(),renderDate.getMonth()+1,1))} className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 transition-colors text-sm font-bold">›</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View type switcher */}
          <div className="relative flex bg-slate-200/40 dark:bg-black/25 p-0.5 rounded-full border border-white/15 dark:border-white/5">
            <div className="absolute top-0.5 bottom-0.5 rounded-full bg-white/90 dark:bg-white/20 shadow border border-white/50 dark:border-white/15 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{width:'calc(33.33% - 2px)',transform:`translateX(${['Monthly','Weekly','Daily'].indexOf(viewType)*100}%)`}}/>
            {['Monthly','Weekly','Daily'].map(v=>(
              <button key={v} onClick={()=>setViewType(v)}
                className={`relative flex-1 px-3 py-1.5 text-xs font-bold z-10 transition-all
                  ${viewType===v?'text-slate-900 dark:text-white font-black':'text-slate-500 dark:text-slate-400'}`}>
                {v}
              </button>
            ))}
          </div>
          {timerIsland}
          {themeToggle}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

        {/* Row 1: total grind + timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1 p-5 flex flex-col justify-center border-t-4" style={{borderTopColor:'#3b82f6'}}>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Grind</h3>
            <div className="text-3xl font-black text-slate-800 dark:text-white mb-2">{fmtHrs(stats.total)}</div>
            <div className="text-[10px] font-bold text-slate-500 bg-slate-100/60 dark:bg-white/6 px-2.5 py-1 rounded-xl inline-block">
              Avg: {Math.round((stats.total/days)*10)/10} hrs/day
            </div>
          </Card>

          <Card className="lg:col-span-3 p-5 flex flex-col min-h-[260px]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"/>
                <h3 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-widest">Overall Timeline</h3>
              </div>
              <ChartDD label="Chart" value={totalChart} opts={['Line',...(viewType!=='Daily'?['Bar']:[])]} isOpen={totalOpen} setOpen={setTotalOpen} onChange={setTotalChart} cls="td"/>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              {totalChart==='Bar'
                ?<BarChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15}/>
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:10,fontWeight:700}} axisLine={false} tickLine={false} dy={8}/>
                  <YAxis domain={[0,maxY]} ticks={yTicks} stroke="#64748b" tick={{fontSize:10,fontWeight:700}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>} cursor={{fill:'#334155',opacity:0.08}}/>
                  <Bar dataKey="hours" fill="#3b82f6" radius={[5,5,0,0]} animationDuration={800} name="Total Hours"/>
                </BarChart>
                :<LineChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15}/>
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:10,fontWeight:700}} axisLine={false} tickLine={false} dy={8}/>
                  <YAxis domain={[0,maxY]} ticks={yTicks} stroke="#64748b" tick={{fontSize:10,fontWeight:700}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>} cursor={{stroke:'#334155',strokeWidth:1,strokeDasharray:'3 3'}}/>
                  <Line type="linear" dataKey="hours" stroke="#3b82f6" strokeWidth={3} dot={<EndDot/>} activeDot={{r:5}} animationDuration={800} connectNulls={false}/>
                </LineChart>
              }
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Row 2: subject cards + subject split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 flex flex-col gap-3">
            {['Physics','Chemistry','Mathematics'].map(subj=>{
              const val=stats[subj.toLowerCase().replace('mathematics','math')];
              return(
                <Card key={subj} className="p-4 border-l-4 cursor-pointer hover:scale-[1.01] transition-transform" style={{borderLeftColor:SC[subj]}} onClick={()=>setSubjPopup(subj)}>
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.18em]" style={{color:SC[subj]}}>{subj}</h3>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100/60 dark:bg-white/6 px-1.5 py-0.5 rounded-lg">Avg: {Math.round((val/days)*10)/10}</span>
                  </div>
                  <div className="text-xl font-black text-slate-800 dark:text-white">{fmtHrs(val)}</div>
                </Card>
              );
            })}
          </div>

          <Card className="lg:col-span-3 p-5 flex flex-col min-h-[260px]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"/>
                <h3 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-widest">Subject Split</h3>
              </div>
              <ChartDD label="Chart" value={subjChart} opts={['Line','Pie',...(viewType!=='Daily'?['Bar']:[])]} isOpen={subjOpen} setOpen={setSubjOpen} onChange={setSubjChart} cls="sd"/>
            </div>
            <div className="flex-1 w-full flex justify-center items-center min-h-[220px]">
              {subjChart==='Pie'
                ? pieData.length>0
                  ? <ResponsiveContainer width="100%" height={260}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={6} dataKey="value" stroke="none" labelLine={false} label={<PieLabel/>} onClick={d=>setSubjPopup(d.name)} cursor="pointer">
                          {pieData.map((e,i)=><Cell key={i} fill={SC[e.name]} opacity={subjPopup?(subjPopup===e.name?1:0.2):1} style={{transition:'opacity 0.2s'}}/>)}
                        </Pie><Tooltip content={<Tip/>}/><Legend verticalAlign="bottom" height={32} iconType="circle"/></PieChart>
                    </ResponsiveContainer>
                  : <div className="text-slate-500 font-bold text-sm">No data yet.</div>
                : subjChart==='Bar'
                  ? <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15}/>
                        <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:10}} axisLine={false} tickLine={false} dy={8}/>
                        <YAxis domain={[0,maxY]} ticks={yTicks} stroke="#64748b" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<Tip/>} cursor={{fill:'#334155',opacity:0.08}}/>
                        <Bar dataKey="Physics" stackId="a" fill={SC.Physics} radius={[5,5,0,0]} animationDuration={800}/>
                        <Bar dataKey="Chemistry" stackId="a" fill={SC.Chemistry} animationDuration={800}/>
                        <Bar dataKey="Mathematics" stackId="a" fill={SC.Mathematics} radius={[5,5,0,0]} animationDuration={800}/>
                      </BarChart>
                    </ResponsiveContainer>
                  : <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15}/>
                        <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:10}} axisLine={false} tickLine={false} dy={8}/>
                        <YAxis domain={[0,maxY]} ticks={yTicks} stroke="#64748b" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<Tip/>} cursor={{stroke:'#334155',strokeWidth:1,strokeDasharray:'3 3'}}/>
                        {['Physics','Chemistry','Mathematics'].map(s=><Line key={s} type="linear" dataKey={s} stroke={SC[s]} strokeWidth={2.5} dot={<EndDot dataKey={s}/>} activeDot={{r:5}} animationDuration={800} connectNulls={false}/>)}
                      </LineChart>
                    </ResponsiveContainer>
              }
            </div>
          </Card>
        </div>

        {/* Row 3: mock analytics */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Target size={14} className="text-red-500 fill-red-500"/>
            <h3 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-widest">Mock Test Analytics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[{label:'JEE Mains',data:mainsA,list:mains},{label:'JEE Advanced',data:advA,list:adv}].map(({label,data,list})=>(
              <div key={label} className="flex flex-col items-center bg-white/15 dark:bg-white/3 rounded-2xl p-4 border border-white/15 dark:border-white/5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{label}</h4>
                {list.length>0
                  ?<ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={data.data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none" labelLine={false} label={<PieLabel/>} onClick={d=>setMockPopup({category:label,color:d.color,list:data.lists[d.name]})} cursor="pointer">
                        {data.data.map((e,i)=><Cell key={i} fill={e.color} style={{outline:'none'}}/>)}
                      </Pie><Tooltip content={<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 px-3 py-2 rounded-xl text-xs font-bold">Click to view</div>}/></PieChart>
                  </ResponsiveContainer>
                  :<div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-400 py-10">No completed mocks this month.</div>}
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
