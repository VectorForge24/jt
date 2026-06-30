import React, { useState, useEffect } from 'react';
import { Atom, FlaskConical, Pi, CheckSquare, Square, ChevronDown, Trash2, GripVertical, Plus, X, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';

const sprayConfetti = () => {
  const end = Date.now() + 2000;
  const fire = () => {
    confetti({ particleCount:5, angle:60,  spread:70, origin:{x:0,y:0.7}, gravity:0.8, ticks:150, colors:['#3b82f6','#f59e0b','#ec4899'] });
    confetti({ particleCount:5, angle:120, spread:70, origin:{x:1,y:0.7}, gravity:0.8, ticks:150, colors:['#3b82f6','#f59e0b','#ec4899'] });
    if (Date.now() < end) requestAnimationFrame(fire);
  };
  fire();
};

const defaultSyllabus = [
  { id:'p1',  subject:'Physics',     title:'Units and Measurements',                       priority:'None' },
  { id:'p2',  subject:'Physics',     title:'Kinematics',                                   priority:'None' },
  { id:'p3',  subject:'Physics',     title:'Laws of Motion',                               priority:'None' },
  { id:'p4',  subject:'Physics',     title:'Work Energy and Power',                        priority:'None' },
  { id:'p5',  subject:'Physics',     title:'System of Particles and Rotational Motion',    priority:'None' },
  { id:'p6',  subject:'Physics',     title:'Gravitation',                                  priority:'None' },
  { id:'p7',  subject:'Physics',     title:'Properties of Bulk Matter',                    priority:'None' },
  { id:'p8',  subject:'Physics',     title:'Thermodynamics',                               priority:'None' },
  { id:'p9',  subject:'Physics',     title:'Kinetic Theory of Gases',                      priority:'None' },
  { id:'p10', subject:'Physics',     title:'Oscillations',                                 priority:'None' },
  { id:'p11', subject:'Physics',     title:'Waves',                                        priority:'None' },
  { id:'p12', subject:'Physics',     title:'Electrostatics',                               priority:'None' },
  { id:'p13', subject:'Physics',     title:'Current Electricity',                          priority:'None' },
  { id:'p14', subject:'Physics',     title:'Magnetic Effects of Current',                  priority:'None' },
  { id:'p15', subject:'Physics',     title:'Magnetism and Matter',                         priority:'None' },
  { id:'p16', subject:'Physics',     title:'Electromagnetic Induction',                    priority:'None' },
  { id:'p17', subject:'Physics',     title:'Alternating Current',                          priority:'None' },
  { id:'p18', subject:'Physics',     title:'Electromagnetic Waves',                        priority:'None' },
  { id:'p19', subject:'Physics',     title:'Ray Optics',                                   priority:'None' },
  { id:'p20', subject:'Physics',     title:'Wave Optics',                                  priority:'None' },
  { id:'p21', subject:'Physics',     title:'Dual Nature of Radiation and Matter',          priority:'None' },
  { id:'p22', subject:'Physics',     title:'Atoms',                                        priority:'None' },
  { id:'p23', subject:'Physics',     title:'Nuclei',                                       priority:'None' },
  { id:'p24', subject:'Physics',     title:'Semiconductor Electronics',                    priority:'None' },
  { id:'c1',  subject:'Chemistry',   title:'Some Basic Concepts of Chemistry',             priority:'None' },
  { id:'c2',  subject:'Chemistry',   title:'Structure of Atom',                            priority:'None' },
  { id:'c3',  subject:'Chemistry',   title:'Classification of Elements',                   priority:'None' },
  { id:'c4',  subject:'Chemistry',   title:'Chemical Bonding',                             priority:'None' },
  { id:'c5',  subject:'Chemistry',   title:'States of Matter',                             priority:'None' },
  { id:'c6',  subject:'Chemistry',   title:'Thermodynamics',                               priority:'None' },
  { id:'c7',  subject:'Chemistry',   title:'Equilibrium',                                  priority:'None' },
  { id:'c8',  subject:'Chemistry',   title:'Redox Reactions',                              priority:'None' },
  { id:'c9',  subject:'Chemistry',   title:'Hydrogen',                                     priority:'None' },
  { id:'c10', subject:'Chemistry',   title:'s-Block Elements',                             priority:'None' },
  { id:'c11', subject:'Chemistry',   title:'p-Block Elements',                             priority:'None' },
  { id:'c12', subject:'Chemistry',   title:'Organic Chemistry Basics',                     priority:'None' },
  { id:'c13', subject:'Chemistry',   title:'Hydrocarbons',                                 priority:'None' },
  { id:'c14', subject:'Chemistry',   title:'Environmental Chemistry',                      priority:'None' },
  { id:'c15', subject:'Chemistry',   title:'Solid State',                                  priority:'None' },
  { id:'c16', subject:'Chemistry',   title:'Solutions',                                    priority:'None' },
  { id:'c17', subject:'Chemistry',   title:'Electrochemistry',                             priority:'None' },
  { id:'c18', subject:'Chemistry',   title:'Chemical Kinetics',                            priority:'None' },
  { id:'c19', subject:'Chemistry',   title:'Surface Chemistry',                            priority:'None' },
  { id:'c20', subject:'Chemistry',   title:'d and f Block Elements',                       priority:'None' },
  { id:'c21', subject:'Chemistry',   title:'Coordination Compounds',                       priority:'None' },
  { id:'c22', subject:'Chemistry',   title:'Haloalkanes and Haloarenes',                   priority:'None' },
  { id:'c23', subject:'Chemistry',   title:'Alcohols Phenols and Ethers',                  priority:'None' },
  { id:'c24', subject:'Chemistry',   title:'Aldehydes Ketones and Carboxylic Acids',       priority:'None' },
  { id:'c25', subject:'Chemistry',   title:'Amines',                                       priority:'None' },
  { id:'c26', subject:'Chemistry',   title:'Biomolecules',                                 priority:'None' },
  { id:'c27', subject:'Chemistry',   title:'Polymers',                                     priority:'None' },
  { id:'c28', subject:'Chemistry',   title:'Salt Hydrolysis',                              priority:'None' },
  { id:'c29', subject:'Chemistry',   title:'Chemistry in Everyday Life',                   priority:'None' },
  { id:'m1',  subject:'Mathematics', title:'Sets Relations and Functions',                 priority:'None' },
  { id:'m2',  subject:'Mathematics', title:'Complex Numbers',                              priority:'None' },
  { id:'m3',  subject:'Mathematics', title:'Quadratic Equations',                          priority:'None' },
  { id:'m4',  subject:'Mathematics', title:'Permutations and Combinations',                priority:'None' },
  { id:'m5',  subject:'Mathematics', title:'Binomial Theorem',                             priority:'None' },
  { id:'m6',  subject:'Mathematics', title:'Sequences and Series',                         priority:'None' },
  { id:'m7',  subject:'Mathematics', title:'Limits Continuity and Differentiability',      priority:'None' },
  { id:'m8',  subject:'Mathematics', title:'Methods of Differentiation',                   priority:'None' },
  { id:'m9',  subject:'Mathematics', title:'Application of Derivatives',                   priority:'None' },
  { id:'m10', subject:'Mathematics', title:'Indefinite Integration',                       priority:'None' },
  { id:'m11', subject:'Mathematics', title:'Definite Integration',                         priority:'None' },
  { id:'m12', subject:'Mathematics', title:'Area Under Curves',                            priority:'None' },
  { id:'m13', subject:'Mathematics', title:'Differential Equations',                       priority:'None' },
  { id:'m14', subject:'Mathematics', title:'Coordinate Geometry Basics',                   priority:'None' },
  { id:'m15', subject:'Mathematics', title:'Straight Lines',                               priority:'None' },
  { id:'m16', subject:'Mathematics', title:'Circles',                                      priority:'None' },
  { id:'m17', subject:'Mathematics', title:'Parabola',                                     priority:'None' },
  { id:'m18', subject:'Mathematics', title:'Ellipse',                                      priority:'None' },
  { id:'m19', subject:'Mathematics', title:'Hyperbola',                                    priority:'None' },
  { id:'m20', subject:'Mathematics', title:'Vectors',                                      priority:'None' },
  { id:'m21', subject:'Mathematics', title:'3D Geometry',                                  priority:'None' },
  { id:'m22', subject:'Mathematics', title:'Probability',                                  priority:'None' },
  { id:'m23', subject:'Mathematics', title:'Statistics',                                   priority:'None' },
  { id:'m24', subject:'Mathematics', title:'Trigonometric Ratios and Identities',          priority:'None' },
  { id:'m25', subject:'Mathematics', title:'Trigonometric Equations',                      priority:'None' },
  { id:'m26', subject:'Mathematics', title:'Properties of Triangles',                      priority:'None' },
  { id:'m27', subject:'Mathematics', title:'Inverse Trigonometry',                         priority:'None' },
  { id:'m28', subject:'Mathematics', title:'Matrices and Determinants',                    priority:'None' },
];

const defaultMaterials = { Physics:['NCERT','PYQS','MODULES'], Chemistry:['PYQS','SHEET','DPPS'], Mathematics:['NCERT','PYQS','MODULES'] };

const SUBJ_CONFIG = {
  Physics:    { icon: <Atom size={15}/>,         color:'#3b82f6', light:'bg-blue-500/10',   border:'border-blue-500/20'   },
  Chemistry:  { icon: <FlaskConical size={15}/>, color:'#10b981', light:'bg-emerald-500/10', border:'border-emerald-500/20' },
  Mathematics:{ icon: <Pi size={15}/>,           color:'#a855f7', light:'bg-purple-500/10', border:'border-purple-500/20'  },
};

export default function SyllabusView({ themeToggle, timerIsland, syncTrigger }) {
  const [activeSubject, setActiveSubject]   = useState('Physics');
  const [isEditMode,    setIsEditMode]      = useState(false);
  const [openPriorityId,setOpenPriorityId]  = useState(null);
  const [draggedId,     setDraggedId]       = useState(null);

  const [syllabus,  setSyllabus]  = useState(() => { const s=localStorage.getItem('tracker-syllabus'); return s?JSON.parse(s):defaultSyllabus; });
  const [materials, setMaterials] = useState(() => { const m=localStorage.getItem('tracker-materials'); return m?JSON.parse(m):defaultMaterials; });

  useEffect(() => { localStorage.setItem('tracker-syllabus', JSON.stringify(syllabus));   syncTrigger?.(); }, [syllabus]);
  useEffect(() => { localStorage.setItem('tracker-materials', JSON.stringify(materials)); syncTrigger?.(); }, [materials]);

  useEffect(() => {
    const close = e => { if (!e.target.closest('.prio-dd')) setOpenPriorityId(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const activeChapters = syllabus.filter(ch => ch.subject === activeSubject);
  const activeMats     = materials[activeSubject] || [];
  const totalTasks     = activeChapters.length * activeMats.length;
  const completedTasks = activeChapters.reduce((acc, ch) => {
    activeMats.forEach(mat => { if (ch.progress?.[mat] ?? ch[`col${activeMats.indexOf(mat)+1}`]) acc++; });
    return acc;
  }, 0);
  const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const cfg = SUBJ_CONFIG[activeSubject];

  const toggleCheckbox = (id, matName, matIdx) => {
    setSyllabus(prev => prev.map(ch => {
      if (ch.id !== id) return ch;
      const legKey = `col${matIdx+1}`;
      const prog   = ch.progress || {};
      const cur    = prog[matName] !== undefined ? prog[matName] : ch[legKey];
      if (!cur) sprayConfetti();
      return { ...ch, progress:{ ...prog, [matName]:!cur }, [legKey]:!cur };
    }));
  };

  const updatePriority  = (id, v)  => setSyllabus(p => p.map(ch => ch.id===id ? {...ch,priority:v} : ch));
  const renameChapter   = (id, t)  => { const n=prompt('Rename Chapter:',t); if(n?.trim()) setSyllabus(p=>p.map(ch=>ch.id===id?{...ch,title:n.trim()}:ch)); };
  const deleteChapter   = id       => { if(confirm('Delete this chapter?')) setSyllabus(p=>p.filter(ch=>ch.id!==id)); };
  const addChapter      = ()       => { const t=prompt(`New chapter for ${activeSubject}:`); if(t?.trim()) setSyllabus([...syllabus,{id:`new_${Date.now()}`,subject:activeSubject,title:t.trim(),priority:'None',progress:{}}]); };
  const addMaterial     = ()       => { const m=prompt('New material column:'); if(m?.trim()) setMaterials(p=>({...p,[activeSubject]:[...(p[activeSubject]||[]),m.trim().toUpperCase()]})); };
  const removeMaterial  = mat      => { if(confirm(`Delete column ${mat}?`)) setMaterials(p=>({...p,[activeSubject]:p[activeSubject].filter(m=>m!==mat)})); };
  const handleDragStart = (e, id)  => { setDraggedId(id); e.dataTransfer.effectAllowed='move'; };
  const handleDrop      = (e, tid) => {
    e.preventDefault();
    if (draggedId===tid||!draggedId) return;
    const ns=[...syllabus];
    const si=ns.findIndex(c=>c.id===draggedId), ti=ns.findIndex(c=>c.id===tid);
    const [mc]=ns.splice(si,1); ns.splice(ti,0,mc);
    setSyllabus(ns); setDraggedId(null);
  };

  const rowBg = prio => {
    if (prio==='High')   return 'bg-red-500/8 dark:bg-red-500/8 border-red-500/15';
    if (prio==='Medium') return 'bg-yellow-500/8 dark:bg-yellow-500/8 border-yellow-500/15';
    if (prio==='Low')    return 'bg-green-500/8 dark:bg-green-500/8 border-green-500/15';
    return 'bg-transparent border-slate-200/30 dark:border-white/5 hover:bg-white/8 dark:hover:bg-white/3';
  };

  const gridCols = `44px 1fr repeat(${activeMats.length}, minmax(72px,96px)) 110px`;

  return (
    <div className="glass-card w-full flex flex-col relative rounded-[28px] shadow-2xl mb-2 mr-2 overflow-hidden" style={{minHeight:'calc(100vh - 80px)'}}>

      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-white/15 dark:border-white/5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Syllabus</h2>

          {isEditMode && (
            <div className="flex gap-1.5">
              <button onClick={addChapter}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                <Plus size={12}/> Chapter
              </button>
              <button onClick={addMaterial}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                <Plus size={12}/> Column
              </button>
            </div>
          )}

          {/* Subject switcher */}
          <div className="relative flex bg-slate-200/40 dark:bg-black/25 p-0.5 rounded-full border border-white/15 dark:border-white/5">
            <div className="absolute top-0.5 bottom-0.5 rounded-full bg-white/90 dark:bg-white/20 shadow border border-white/50 dark:border-white/15 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{width:'calc(33.33% - 2px)', transform:`translateX(${['Physics','Chemistry','Mathematics'].indexOf(activeSubject)*100}%)`}}/>
            {['Physics','Chemistry','Mathematics'].map(sub => (
              <button key={sub} onClick={()=>setActiveSubject(sub)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold z-10 transition-all rounded-full
                  ${activeSubject===sub ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {SUBJ_CONFIG[sub].icon}
                {sub==='Mathematics'?'Maths':sub}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{color:cfg.color}}>{pct}% Done</span>
            <div className="w-24 h-2 rounded-full overflow-hidden bg-slate-200/50 dark:bg-white/8 shadow-inner">
              <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:cfg.color}}/>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-200/60 dark:bg-white/10"/>
          <button onClick={()=>setIsEditMode(!isEditMode)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all
              ${isEditMode
                ? 'bg-blue-600 text-white shadow shadow-blue-500/30 border border-blue-400/50'
                : 'bg-white/40 dark:bg-white/8 text-slate-700 dark:text-slate-300 border border-white/25 dark:border-white/8 hover:bg-white/60 dark:hover:bg-white/15'}`}>
            {isEditMode ? 'Done' : 'Edit'}
          </button>
          <div className="flex items-center gap-2">{timerIsland}{themeToggle}</div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <div className="w-full max-w-6xl mx-auto rounded-2xl border border-white/20 dark:border-white/6 bg-white/20 dark:bg-white/3 overflow-hidden backdrop-blur-sm">

          {/* Column headers */}
          <div className="grid gap-3 px-4 py-3 border-b border-white/15 dark:border-white/6 bg-white/25 dark:bg-white/4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-xl z-10"
            style={{gridTemplateColumns:gridCols}}>
            <div className="text-center">#</div>
            <div>Chapter</div>
            {activeMats.map((mat,i) => (
              <div key={i} className="flex items-center justify-center gap-1">
                {mat}
                {isEditMode && <X size={11} onClick={()=>removeMaterial(mat)} className="text-red-400 hover:text-red-500 cursor-pointer ml-0.5"/>}
              </div>
            ))}
            <div className="text-center">Priority</div>
          </div>

          {/* Rows */}
          {activeChapters.map((ch, idx) => {
            const allDone = activeMats.length>0 && activeMats.every(mat=>ch.progress?.[mat]);
            return (
              <div key={ch.id}
                draggable={isEditMode}
                onDragStart={e=>handleDragStart(e,ch.id)}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>handleDrop(e,ch.id)}
                className={`grid gap-3 px-4 py-3 border-b items-center transition-all
                  ${allDone ? 'opacity-40 grayscale' : rowBg(ch.priority)}
                  ${draggedId===ch.id ? 'opacity-40 scale-98' : ''}`}
                style={{gridTemplateColumns:gridCols}}>

                {/* # / drag handle */}
                <div className="flex justify-center items-center">
                  {isEditMode
                    ? <GripVertical size={14} className="text-slate-400 cursor-grab hover:text-blue-500 transition-colors"/>
                    : <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{idx+1}</span>}
                </div>

                {/* Title */}
                <div className="flex items-center justify-between pr-3 gap-2">
                  <span className={`text-sm font-semibold truncate
                    ${allDone ? 'line-through text-slate-400' : ch.priority!=='None' ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                    {ch.title}
                  </span>
                  {isEditMode && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Pencil size={13} onClick={()=>renameChapter(ch.id,ch.title)} className="text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"/>
                      <Trash2 size={13} onClick={()=>deleteChapter(ch.id)}          className="text-slate-400 hover:text-red-500 cursor-pointer transition-colors"/>
                    </div>
                  )}
                </div>

                {/* Material checkboxes */}
                {activeMats.map((mat, mi) => {
                  const done = ch.progress?.[mat] ?? ch[`col${mi+1}`];
                  return (
                    <div key={mi} className="flex justify-center cursor-pointer"
                      onClick={()=>toggleCheckbox(ch.id, mat, mi)}>
                      {done
                        ? <CheckSquare size={18} style={{color:cfg.color}} className="drop-shadow-sm"/>
                        : <Square size={18} className="text-slate-300 dark:text-slate-600 hover:text-blue-400 transition-colors"/>}
                    </div>
                  );
                })}

                {/* Priority */}
                <div className="flex justify-center prio-dd">
                  <div className="relative w-full max-w-[96px]">
                    <div onClick={()=>setOpenPriorityId(openPriorityId===ch.id?null:ch.id)}
                      className={`flex justify-between items-center px-2.5 py-1.5 rounded-full text-[10px] font-bold cursor-pointer border transition-all
                        ${ch.priority==='High'  ?'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25'
                        :ch.priority==='Medium' ?'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/25'
                        :ch.priority==='Low'    ?'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25'
                        :'bg-white/20 dark:bg-white/5 text-slate-500 border-white/20 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15'}`}>
                      <span>{ch.priority}</span>
                      <ChevronDown size={11} className="opacity-60"/>
                    </div>
                    {openPriorityId===ch.id && (
                      <div className="absolute top-full left-0 mt-1 w-28 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden p-1">
                        {['None','Low','Medium','High'].map(p => (
                          <div key={p} onClick={()=>{updatePriority(ch.id,p);setOpenPriorityId(null);}}
                            className={`px-3 py-2 text-xs font-bold cursor-pointer rounded-xl transition-colors
                              ${ch.priority===p?'bg-blue-500/15 text-blue-600 dark:text-blue-400':'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                            {p}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
