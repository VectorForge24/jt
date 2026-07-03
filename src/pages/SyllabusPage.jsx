import { useState, useEffect } from 'react';
import { CheckSquare, Square, ChevronDown, Trash2, Plus, Pencil, GripVertical } from 'lucide-react';
import confetti from 'canvas-confetti';

const DEFAULT_SYLLABUS = [
  {id:'p1',subject:'Physics',title:'Units and Measurements',priority:'None'},{id:'p2',subject:'Physics',title:'Kinematics',priority:'None'},{id:'p3',subject:'Physics',title:'Laws of Motion',priority:'None'},{id:'p4',subject:'Physics',title:'Work Energy and Power',priority:'None'},{id:'p5',subject:'Physics',title:'System of Particles and Rotational Motion',priority:'None'},{id:'p6',subject:'Physics',title:'Gravitation',priority:'None'},{id:'p7',subject:'Physics',title:'Properties of Bulk Matter',priority:'None'},{id:'p8',subject:'Physics',title:'Thermodynamics',priority:'None'},{id:'p9',subject:'Physics',title:'Kinetic Theory of Gases',priority:'None'},{id:'p10',subject:'Physics',title:'Oscillations',priority:'None'},{id:'p11',subject:'Physics',title:'Waves',priority:'None'},{id:'p12',subject:'Physics',title:'Electrostatics',priority:'None'},{id:'p13',subject:'Physics',title:'Current Electricity',priority:'None'},{id:'p14',subject:'Physics',title:'Magnetic Effects of Current',priority:'None'},{id:'p15',subject:'Physics',title:'Magnetism and Matter',priority:'None'},{id:'p16',subject:'Physics',title:'Electromagnetic Induction',priority:'None'},{id:'p17',subject:'Physics',title:'Alternating Current',priority:'None'},{id:'p18',subject:'Physics',title:'Electromagnetic Waves',priority:'None'},{id:'p19',subject:'Physics',title:'Ray Optics',priority:'None'},{id:'p20',subject:'Physics',title:'Wave Optics',priority:'None'},{id:'p21',subject:'Physics',title:'Dual Nature of Radiation and Matter',priority:'None'},{id:'p22',subject:'Physics',title:'Atoms',priority:'None'},{id:'p23',subject:'Physics',title:'Nuclei',priority:'None'},{id:'p24',subject:'Physics',title:'Semiconductor Electronics',priority:'None'},
  {id:'c1',subject:'Chemistry',title:'Some Basic Concepts of Chemistry',priority:'None'},{id:'c2',subject:'Chemistry',title:'Structure of Atom',priority:'None'},{id:'c3',subject:'Chemistry',title:'Classification of Elements',priority:'None'},{id:'c4',subject:'Chemistry',title:'Chemical Bonding',priority:'None'},{id:'c5',subject:'Chemistry',title:'States of Matter',priority:'None'},{id:'c6',subject:'Chemistry',title:'Thermodynamics',priority:'None'},{id:'c7',subject:'Chemistry',title:'Equilibrium',priority:'None'},{id:'c8',subject:'Chemistry',title:'Redox Reactions',priority:'None'},{id:'c9',subject:'Chemistry',title:'Hydrogen',priority:'None'},{id:'c10',subject:'Chemistry',title:'s-Block Elements',priority:'None'},{id:'c11',subject:'Chemistry',title:'p-Block Elements',priority:'None'},{id:'c12',subject:'Chemistry',title:'Organic Chemistry Basics',priority:'None'},{id:'c13',subject:'Chemistry',title:'Hydrocarbons',priority:'None'},{id:'c14',subject:'Chemistry',title:'Environmental Chemistry',priority:'None'},{id:'c15',subject:'Chemistry',title:'Solid State',priority:'None'},{id:'c16',subject:'Chemistry',title:'Solutions',priority:'None'},{id:'c17',subject:'Chemistry',title:'Electrochemistry',priority:'None'},{id:'c18',subject:'Chemistry',title:'Chemical Kinetics',priority:'None'},{id:'c19',subject:'Chemistry',title:'Surface Chemistry',priority:'None'},{id:'c20',subject:'Chemistry',title:'d and f Block Elements',priority:'None'},{id:'c21',subject:'Chemistry',title:'Coordination Compounds',priority:'None'},{id:'c22',subject:'Chemistry',title:'Haloalkanes and Haloarenes',priority:'None'},{id:'c23',subject:'Chemistry',title:'Alcohols Phenols and Ethers',priority:'None'},{id:'c24',subject:'Chemistry',title:'Aldehydes Ketones and Carboxylic Acids',priority:'None'},{id:'c25',subject:'Chemistry',title:'Amines',priority:'None'},{id:'c26',subject:'Chemistry',title:'Biomolecules',priority:'None'},{id:'c27',subject:'Chemistry',title:'Polymers',priority:'None'},{id:'c28',subject:'Chemistry',title:'Salt Hydrolysis',priority:'None'},{id:'c29',subject:'Chemistry',title:'Chemistry in Everyday Life',priority:'None'},
  {id:'m1',subject:'Mathematics',title:'Sets Relations and Functions',priority:'None'},{id:'m2',subject:'Mathematics',title:'Complex Numbers',priority:'None'},{id:'m3',subject:'Mathematics',title:'Quadratic Equations',priority:'None'},{id:'m4',subject:'Mathematics',title:'Permutations and Combinations',priority:'None'},{id:'m5',subject:'Mathematics',title:'Binomial Theorem',priority:'None'},{id:'m6',subject:'Mathematics',title:'Sequences and Series',priority:'None'},{id:'m7',subject:'Mathematics',title:'Limits Continuity and Differentiability',priority:'None'},{id:'m8',subject:'Mathematics',title:'Methods of Differentiation',priority:'None'},{id:'m9',subject:'Mathematics',title:'Application of Derivatives',priority:'None'},{id:'m10',subject:'Mathematics',title:'Indefinite Integration',priority:'None'},{id:'m11',subject:'Mathematics',title:'Definite Integration',priority:'None'},{id:'m12',subject:'Mathematics',title:'Area Under Curves',priority:'None'},{id:'m13',subject:'Mathematics',title:'Differential Equations',priority:'None'},{id:'m14',subject:'Mathematics',title:'Coordinate Geometry Basics',priority:'None'},{id:'m15',subject:'Mathematics',title:'Straight Lines',priority:'None'},{id:'m16',subject:'Mathematics',title:'Circles',priority:'None'},{id:'m17',subject:'Mathematics',title:'Parabola',priority:'None'},{id:'m18',subject:'Mathematics',title:'Ellipse',priority:'None'},{id:'m19',subject:'Mathematics',title:'Hyperbola',priority:'None'},{id:'m20',subject:'Mathematics',title:'Vectors',priority:'None'},{id:'m21',subject:'Mathematics',title:'3D Geometry',priority:'None'},{id:'m22',subject:'Mathematics',title:'Probability',priority:'None'},{id:'m23',subject:'Mathematics',title:'Statistics',priority:'None'},{id:'m24',subject:'Mathematics',title:'Trigonometric Ratios and Identities',priority:'None'},{id:'m25',subject:'Mathematics',title:'Trigonometric Equations',priority:'None'},{id:'m26',subject:'Mathematics',title:'Properties of Triangles',priority:'None'},{id:'m27',subject:'Mathematics',title:'Inverse Trigonometry',priority:'None'},{id:'m28',subject:'Mathematics',title:'Matrices and Determinants',priority:'None'},
];

const DEFAULT_MATERIALS = { Physics:['PYQS','MODULES','DPPS'], Chemistry:['PYQS','SHEET','DPPS'], Mathematics:['PYQS','MODULES','DPPS'] };
const SUBJ_COLOR = { Physics:'#3b82f6', Chemistry:'#10b981', Mathematics:'#a855f7' };
const SUBJECTS = ['Physics','Chemistry','Mathematics'];

function fire() {
  confetti({ particleCount:40, spread:60, origin:{x:0.5,y:0.6}, gravity:0.9, colors:['#3b82f6','#10b981','#f59e0b'] });
}

export default function SyllabusPage({ appState }) {
  const { syllabus: rawSyllabus, setSyllabus, materials: rawMaterials, setMaterials } = appState;

  const syllabus  = rawSyllabus?.length  ? rawSyllabus  : DEFAULT_SYLLABUS;
  const materials = rawMaterials && Object.keys(rawMaterials).length ? rawMaterials : DEFAULT_MATERIALS;

  const [activeSubj, setActiveSubj] = useState('Physics');
  const [editMode,   setEditMode]   = useState(false);
  const [openPrioId, setOpenPrioId] = useState(null);
  const [draggedId,  setDraggedId]  = useState(null);

  const subj = activeSubj;
  const mats = materials[subj] || [];
  const chapters = syllabus.filter(c => c.subject === subj);

  const total     = chapters.length * mats.length;
  const completed = chapters.reduce((acc, ch) => {
    mats.forEach(mat => { if (ch.progress?.[mat] ?? ch[`col${mats.indexOf(mat)+1}`]) acc++; });
    return acc;
  }, 0);
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const color = SUBJ_COLOR[subj];

  useEffect(() => {
    const close = e => { if (!e.target.closest('.prio-dd')) setOpenPrioId(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggleCheck = (id, mat, mi) => {
    setSyllabus(prev => prev.map(ch => {
      if (ch.id !== id) return ch;
      const legKey = `col${mi+1}`;
      const prog = ch.progress || {};
      const cur = prog[mat] !== undefined ? prog[mat] : ch[legKey];
      if (!cur) fire();
      return { ...ch, progress:{ ...prog, [mat]:!cur }, [legKey]:!cur };
    }));
  };

  const updatePriority = (id, v) => setSyllabus(p => p.map(ch => ch.id===id ? {...ch,priority:v} : ch));
  const addChapter     = () => { const t=prompt(`New chapter for ${subj}:`); if(t?.trim()) setSyllabus(s=>[...s,{id:`new_${Date.now()}`,subject:subj,title:t.trim(),priority:'None',progress:{}}]); };
  const renameChapter  = (id,t) => { const n=prompt('Rename Chapter:',t); if(n?.trim()) setSyllabus(p=>p.map(ch=>ch.id===id?{...ch,title:n.trim()}:ch)); };
  const deleteChapter  = id => { if(confirm('Delete this chapter?')) setSyllabus(p=>p.filter(ch=>ch.id!==id)); };
  const addMaterial    = () => { const m=prompt('New material column:'); if(m?.trim()) setMaterials(p=>({...p,[subj]:[...(p[subj]||[]),m.trim().toUpperCase()]})); };
  const removeMaterial = mat => { if(confirm(`Delete column ${mat}?`)) setMaterials(p=>({...p,[subj]:p[subj].filter(m=>m!==mat)})); };

  const handleDragStart = (e, id) => { setDraggedId(id); e.dataTransfer.effectAllowed='move'; };
  const handleDrop = (e, tid) => {
    e.preventDefault(); if(!draggedId||draggedId===tid) return;
    const ns=[...syllabus]; const si=ns.findIndex(c=>c.id===draggedId); const ti=ns.findIndex(c=>c.id===tid);
    const [mc]=ns.splice(si,1); ns.splice(ti,0,mc); setSyllabus(ns); setDraggedId(null);
  };

  const prioStyle = p => p==='High'?{color:'#f87171',bg:'rgba(239,68,68,0.1)',border:'rgba(239,68,68,0.3)'}
    :p==='Medium'?{color:'#fbbf24',bg:'rgba(245,158,11,0.1)',border:'rgba(245,158,11,0.3)'}
    :p==='Low'?{color:'#4ade80',bg:'rgba(74,222,128,0.1)',border:'rgba(74,222,128,0.3)'}
    :{color:'#64748b',bg:'rgba(100,116,139,0.08)',border:'rgba(100,116,139,0.2)'};

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Subject tabs */}
      <div style={{ display:'flex', gap:6, padding:'12px 16px 0', overflowX:'auto' }} className="hide-scrollbar">
        {SUBJECTS.map(s => {
          const sc = SUBJ_COLOR[s];
          const active = s === activeSubj;
          return (
            <button key={s} onClick={() => setActiveSubj(s)}
              style={{ flexShrink:0, padding:'8px 16px', borderRadius:12, fontSize:13, fontWeight:700,
                background: active ? `${sc}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? sc+'55' : 'rgba(255,255,255,0.06)'}`,
                color: active ? sc : '#64748b' }}>
              {s==='Mathematics'?'Maths':s}
            </button>
          );
        })}
      </div>

      {/* Header bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, fontWeight:700, color }}>
            {pct}% Done
          </span>
          <div style={{ width:80, height:5, borderRadius:99, overflow:'hidden', background:'rgba(255,255,255,0.08)' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:color, transition:'width 0.5s ease' }}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {editMode && (
            <>
              <button onClick={addChapter} style={{ padding:'7px 12px', borderRadius:10, fontSize:11, fontWeight:700, color:'#60a5fa', background:'rgba(59,130,246,0.1)', border:'none' }}>
                + Chapter
              </button>
              <button onClick={addMaterial} style={{ padding:'7px 12px', borderRadius:10, fontSize:11, fontWeight:700, color:'#c084fc', background:'rgba(168,85,247,0.1)', border:'none' }}>
                + Column
              </button>
            </>
          )}
          <button onClick={() => setEditMode(!editMode)}
            style={{ padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:700, border:'none',
              background: editMode ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: editMode ? '#fff' : '#94a3b8' }}>
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Table header */}
      <div style={{ margin:'0 16px', borderRadius:'16px 16px 0 0', background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.06)', borderBottom:'none',
        display:'grid', padding:'10px 12px',
        gridTemplateColumns:`1fr ${mats.map(()=>'34px').join(' ')} 62px`,
        gap:4, alignItems:'center' }}>
        <span style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase' }}>Chapter</span>
        {mats.map((mat,i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:8, fontWeight:700, color:'#475569', textTransform:'uppercase', textAlign:'center', lineHeight:1.1 }}>{mat}</span>
            {editMode && <button onClick={() => removeMaterial(mat)} style={{ background:'none', border:'none', padding:0, cursor:'pointer' }}>
              <span style={{ fontSize:9, color:'#ef4444' }}>×</span>
            </button>}
          </div>
        ))}
        <span style={{ fontSize:8, fontWeight:700, color:'#475569', textTransform:'uppercase', textAlign:'center' }}>Priority</span>
      </div>

      {/* Rows */}
      <div style={{ margin:'0 16px', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'0 0 16px 16px', overflow:'hidden', marginBottom:16 }}>
        {chapters.map((ch, idx) => {
          const allDone = mats.length>0 && mats.every(mat => ch.progress?.[mat]);
          const ps = prioStyle(ch.priority||'None');
          const rowBg = ch.priority==='High'?'rgba(239,68,68,0.04)':ch.priority==='Medium'?'rgba(245,158,11,0.04)':ch.priority==='Low'?'rgba(74,222,128,0.04)':'transparent';
          return (
            <div key={ch.id}
              draggable={editMode}
              onDragStart={e => handleDragStart(e, ch.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, ch.id)}
              style={{
                display:'grid', gridTemplateColumns:`1fr ${mats.map(()=>'34px').join(' ')} 62px`,
                gap:4, padding:'10px 12px', alignItems:'center',
                borderBottom:'1px solid rgba(255,255,255,0.04)', background:rowBg,
                opacity: allDone ? 0.4 : 1,
              }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:6, minWidth:0 }}>
                {editMode && <GripVertical size={12} color="#64748b" style={{ cursor:'grab', flexShrink:0, marginTop:2 }}/>}
                <span style={{ fontSize:12.5, fontWeight:500, lineHeight:1.35, color: allDone?'#475569':'#e2e8f0',
                  textDecoration:allDone?'line-through':'none', wordBreak:'break-word' }}>
                  {ch.title}
                </span>
                {editMode && (
                  <div style={{ display:'flex', gap:4, flexShrink:0, marginTop:1 }}>
                    <button onClick={() => renameChapter(ch.id,ch.title)} style={{ background:'none', border:'none', padding:2 }}><Pencil size={11} color="#64748b"/></button>
                    <button onClick={() => deleteChapter(ch.id)} style={{ background:'none', border:'none', padding:2 }}><Trash2 size={11} color="#ef4444"/></button>
                  </div>
                )}
              </div>
              {mats.map((mat,mi) => {
                const done = ch.progress?.[mat] ?? ch[`col${mi+1}`];
                return (
                  <div key={mi} style={{ display:'flex', justifyContent:'center' }}>
                    <button onClick={() => toggleCheck(ch.id,mat,mi)} style={{ background:'none', border:'none', padding:4, cursor:'pointer', minHeight:0 }}>
                      {done ? <CheckSquare size={16} color={color}/> : <Square size={16} color="#334155"/>}
                    </button>
                  </div>
                );
              })}
              {/* Priority dropdown */}
              <div className="prio-dd" style={{ position:'relative' }}>
                <button onClick={() => setOpenPrioId(openPrioId===ch.id?null:ch.id)}
                  style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'5px 8px', borderRadius:8, fontSize:10, fontWeight:700,
                    background:ps.bg, border:`1px solid ${ps.border}`, color:ps.color, cursor:'pointer' }}>
                  <span>{ch.priority||'None'}</span>
                  <ChevronDown size={10}/>
                </button>
                {openPrioId===ch.id && (
                  <div style={{ position:'absolute', top:'110%', left:0, width:90, background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:12, zIndex:50, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
                    {['None','Low','Medium','High'].map(p => (
                      <button key={p} onClick={() => { updatePriority(ch.id,p); setOpenPrioId(null); }}
                        style={{ width:'100%', padding:'9px 12px', fontSize:11, fontWeight:700, textAlign:'left', background:'none', border:'none',
                          borderBottom:'1px solid rgba(255,255,255,0.04)', color: ch.priority===p?color:'#94a3b8', cursor:'pointer' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
