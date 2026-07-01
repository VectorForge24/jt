import { useMemo } from 'react';

function fmtYMD(d) { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }
function extractDate(iso) { return iso?.includes('T') ? iso.split('T')[0] : iso; }
function getHrs(e) { return (new Date(e.end) - new Date(e.start)) / 3_600_000; }

export default function Heatmap({ events, weeks = 12, onDayTap, rankColor = '#3b82f6' }) {
  const cells = useMemo(() => {
    const today = new Date();
    const total = weeks * 7;
    const out = [];
    for (let i = total - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = fmtYMD(d);
      const dayEvs = events.filter(e => extractDate(e.start) === ds && !e.allDay);
      const totalHrs = dayEvs.reduce((s,e) => s+getHrs(e), 0);
      const doneHrs  = dayEvs.filter(e => e.extendedProps?.done ?? e.done).reduce((s,e) => s+getHrs(e), 0);
      const pct = totalHrs > 0 ? doneHrs/totalHrs : -1;
      out.push({ ds, pct, totalHrs, doneHrs, dow:(d.getDay()+6)%7 });
    }
    return out;
  }, [events, weeks]);

  const cols = useMemo(() => {
    const out = []; let col = [];
    const firstDow = cells[0]?.dow ?? 0;
    for (let p=0;p<firstDow;p++) col.push(null);
    for (const c of cells) { col.push(c); if (col.length===7) { out.push(col); col=[]; } }
    if (col.length>0) { while(col.length<7) col.push(null); out.push(col); }
    return out;
  }, [cells]);

  function cellColor(pct) {
    if (pct < 0) return 'rgba(148,163,184,0.1)';
    if (pct >= 0.90) return '#10b981';
    if (pct >= 0.75) return '#34d399';
    if (pct >= 0.55) return '#60a5fa';
    if (pct >= 0.35) return '#f59e0b';
    if (pct >= 0.15) return '#f97316';
    return '#f43f5e';
  }

  const todayStr = fmtYMD(new Date());
  const LABELS = ['M','','W','','F','','S'];
  const C = 13, G = 3;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>Activity</span>
        <div style={{ display:'flex', gap:8, fontSize:9, color:'#64748b' }}>
          <div style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{width:8,height:8,borderRadius:2,background:'#10b981',display:'inline-block'}}/>Elite</div>
          <div style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{width:8,height:8,borderRadius:2,background:'#f43f5e',display:'inline-block'}}/>Low</div>
        </div>
      </div>
      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }} className="hide-scrollbar">
        <div style={{ display:'flex', gap:G, width:'max-content' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:G, marginRight:2 }}>
            {LABELS.map((l,i) => <div key={i} style={{ height:C, width:9, fontSize:7, color:'#64748b', lineHeight:`${C}px`, textAlign:'right', fontFamily:'monospace' }}>{l}</div>)}
          </div>
          {cols.map((col,ci) => (
            <div key={ci} style={{ display:'flex', flexDirection:'column', gap:G }}>
              {col.map((cell,ri) => (
                <button key={ri}
                  onClick={() => cell && onDayTap?.(cell.ds)}
                  style={{
                    width:C, height:C, borderRadius:2, flexShrink:0, padding:0, border:'none',
                    background: cell ? cellColor(cell.pct) : 'transparent',
                    cursor: cell ? 'pointer' : 'default',
                    outline: cell?.ds === todayStr ? '1.5px solid rgba(255,255,255,0.6)' : 'none',
                    minHeight:0,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
