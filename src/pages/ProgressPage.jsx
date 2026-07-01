import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SC = { Physics:'#3b82f6', Chemistry:'#10b981', Mathematics:'#a855f7' };
const fmtHrs = d => { const h=Math.floor(Math.round(d*60)/60), m=Math.round(d*60)%60; return `${h}.${String(m).padStart(2,'0')}h`; };

export default function ProgressPage({ appState }) {
  const { events, mocks } = appState;
  const [renderDate, setRenderDate] = useState(new Date());
  const [viewType, setViewType] = useState('Weekly');

  const mk = `${renderDate.getFullYear()}-${String(renderDate.getMonth()+1).padStart(2,'0')}`;

  const { chartData, stats, days } = useMemo(() => {
    const raw = events.filter(e => e.extendedProps?.done ?? e.done);
    const now = renderDate;
    let data = [], st = { total:0, physics:0, chemistry:0, math:0 }, days;

    if (viewType === 'Weekly') {
      days = 7;
      const sot = new Date(now); sot.setDate(now.getDate() - now.getDay());
      for (let i=0;i<7;i++) {
        const d = new Date(sot); d.setDate(sot.getDate()+i);
        const fut = d > new Date();
        data.push({ name: d.toLocaleDateString('en-US',{weekday:'short'}), dateObj:d, hours: fut?null:0, Physics:fut?null:0, Chemistry:fut?null:0, Mathematics:fut?null:0 });
      }
    } else {
      days = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      for (let i=0;i<days;i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i+1);
        const fut = d > new Date();
        data.push({ name:String(i+1), dateObj:d, hours: fut?null:0, Physics:fut?null:0, Chemistry:fut?null:0, Mathematics:fut?null:0 });
      }
    }

    raw.forEach(e => {
      if (!e.start) return;
      const s = new Date(e.start);
      const subj = e.extendedProps?.subject || e.subject || 'Physics';
      const dur = (new Date(e.end||e.start) - s) / 3600000;
      data.forEach(d => {
        if (d.dateObj && d.dateObj.toDateString()===s.toDateString() && d.hours!==null) {
          d.hours += dur; d[subj] = (d[subj]||0) + dur;
          st.total += dur; st[subj.toLowerCase().replace('mathematics','math')] += dur;
        }
      });
    });
    data.forEach(d => { if (d.hours!==null) d.hours = Math.round(d.hours*10)/10; });

    return { chartData:data, stats:st, days };
  }, [events, viewType, renderDate]);

  const maxY = viewType==='Weekly' ? 17 : 17;
  const pieData = [
    { name:'Physics', value:stats.physics }, { name:'Chemistry', value:stats.chemistry }, { name:'Mathematics', value:stats.math },
  ].filter(d => d.value > 0);

  const monthMocks = mocks.filter(m => m.date?.startsWith(mk));
  const mains = monthMocks.filter(m => m.type==='JEE Mains' && m.isCompleted);
  const adv   = monthMocks.filter(m => m.type==='JEE Advanced' && m.isCompleted);

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 10px' }}>
        <p style={{ fontSize:10, fontWeight:700, color:'#64748b', margin:'0 0 4px' }}>{label}</p>
        {payload.map((p,i) => p.value!==null && <p key={i} style={{ fontSize:11, fontWeight:700, color:p.color||p.fill, margin:0 }}>{p.name}: {p.value}h</p>)}
      </div>
    );
  };

  return (
    <div style={{ paddingBottom:90, padding:'12px 16px 90px' }}>

      {/* View switcher */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {['Weekly','Monthly'].map(v => (
          <button key={v} onClick={() => setViewType(v)}
            style={{ flex:1, padding:'9px 0', borderRadius:12, fontSize:12, fontWeight:700,
              background: viewType===v ? '#3b82f6' : 'rgba(255,255,255,0.04)', color: viewType===v ? '#fff' : '#64748b', border:'none' }}>
            {v}
          </button>
        ))}
      </div>

      {/* Total grind */}
      <div style={{ borderRadius:18, padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:12 }}>
        <p style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 4px' }}>Total Grind</p>
        <p style={{ fontSize:26, fontWeight:800, color:'#f1f5f9', margin:'0 0 8px' }}>{fmtHrs(stats.total)}</p>
        <span style={{ fontSize:11, fontWeight:700, color:'#64748b', background:'rgba(255,255,255,0.04)', padding:'3px 10px', borderRadius:99 }}>
          Avg {Math.round((stats.total/days)*10)/10}h/day
        </span>
      </div>

      {/* Timeline chart */}
      <div style={{ borderRadius:18, padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:12, height:220 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 12px' }}>Timeline</p>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top:5, right:5, left:-24, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2}/>
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize:9 }} axisLine={false} tickLine={false}/>
            <YAxis domain={[0,maxY]} stroke="#64748b" tick={{ fontSize:9 }} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2.5} dot={{ r:3 }} connectNulls={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subject cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        {['Physics','Chemistry','Mathematics'].map(subj => {
          const val = stats[subj.toLowerCase().replace('mathematics','math')];
          return (
            <div key={subj} style={{ borderRadius:14, padding:'12px 10px', background:'rgba(255,255,255,0.03)', borderLeft:`3px solid ${SC[subj]}` }}>
              <p style={{ fontSize:9, fontWeight:700, color:SC[subj], textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 4px' }}>{subj==='Mathematics'?'Maths':subj}</p>
              <p style={{ fontSize:15, fontWeight:800, color:'#f1f5f9', margin:0 }}>{fmtHrs(val)}</p>
            </div>
          );
        })}
      </div>

      {/* Subject split pie */}
      {pieData.length > 0 && (
        <div style={{ borderRadius:18, padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Subject Split</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                {pieData.map((e,i) => <Cell key={i} fill={SC[e.name]}/>)}
              </Pie>
              <Tooltip content={<Tip/>}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mock analytics */}
      <div style={{ borderRadius:18, padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
          <Target size={13} color="#ef4444"/>
          <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>Mock Tests</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{ label:'JEE Mains', list:mains }, { label:'JEE Advanced', list:adv }].map(({ label, list }) => (
            <div key={label} style={{ textAlign:'center', padding:'12px', borderRadius:14, background:'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize:10, fontWeight:700, color:'#64748b', margin:'0 0 6px' }}>{label}</p>
              {list.length > 0 ? (
                <>
                  <p style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', margin:0 }}>{list.length}</p>
                  <p style={{ fontSize:9, color:'#64748b', margin:'2px 0 0' }}>completed</p>
                </>
              ) : <p style={{ fontSize:11, color:'#475569', margin:0 }}>None yet</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
