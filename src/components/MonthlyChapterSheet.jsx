import { useState, useMemo } from 'react';
import BottomSheet from './BottomSheet.jsx';
import { CheckSquare, Square } from 'lucide-react';

const SUBJ_COLOR = { Physics:'#3b82f6', Chemistry:'#10b981', Mathematics:'#a855f7' };
const SUBJECTS = ['Physics','Chemistry','Mathematics'];

function fmtMonthKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

/**
 * MonthlyChapterSheet — Fix #3: restores the ability to map syllabus
 * chapters onto a specific month (e.g. "cover these 5 Physics chapters
 * in July"). Reads the base syllabus list, lets the user pick which
 * chapters belong to the current month, and writes them into
 * appState.chapters with the {monthKey, subject, chapterId, title}
 * shape that TaskEditorSheet's "Linked Chapter" picker already expects
 * but had nothing populating it.
 */
export default function MonthlyChapterSheet({ isOpen, onClose, syllabus, chapters, setChapters, targetDate }) {
  const [subject, setSubject] = useState('Physics');
  const monthKey = fmtMonthKey(targetDate || new Date());

  const alreadyMapped = useMemo(() =>
    new Set((chapters || []).filter(c => c.monthKey === monthKey).map(c => c.chapterId || c.title)),
    [chapters, monthKey]
  );

  const subjectChapters = (syllabus || []).filter(c => c.subject === subject);

  function toggleChapter(ch) {
    const key = ch.id || ch.title;
    const exists = (chapters || []).find(c => c.monthKey === monthKey && (c.chapterId === ch.id || c.title === ch.title));
    if (exists) {
      setChapters(prev => prev.filter(c => c.id !== exists.id));
    } else {
      setChapters(prev => [...(prev || []), {
        id: `mc_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        chapterId: ch.id, title: ch.title, subject: ch.subject, monthKey, done: false,
      }]);
    }
  }

  const monthLabel = (targetDate || new Date()).toLocaleDateString('en-US', { month:'long', year:'numeric' });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Chapters for ${monthLabel}`}>
      <div style={{ display:'flex', gap:6, marginBottom:14, overflowX:'auto' }} className="hide-scrollbar">
        {SUBJECTS.map(s => {
          const sc = SUBJ_COLOR[s]; const active = s === subject;
          return (
            <button key={s} onClick={() => setSubject(s)}
              style={{ flexShrink:0, padding:'8px 16px', borderRadius:12, fontSize:12, fontWeight:700,
                background: active ? `${sc}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? sc+'55' : 'rgba(255,255,255,0.08)'}`,
                color: active ? sc : '#64748b' }}>
              {s==='Mathematics'?'Maths':s}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize:11, color:'#64748b', marginBottom:10, lineHeight:1.5 }}>
        Tap chapters to schedule them for this month. They'll show up as linkable chapters when creating tasks.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:'50vh', overflowY:'auto' }} className="hide-scrollbar">
        {subjectChapters.length === 0 ? (
          <p style={{ fontSize:12, color:'#475569', textAlign:'center', padding:'20px 0' }}>No chapters found for {subject}.</p>
        ) : subjectChapters.map(ch => {
          const isMapped = (chapters || []).some(c => c.monthKey === monthKey && (c.chapterId === ch.id || c.title === ch.title));
          return (
            <button key={ch.id} onClick={() => toggleChapter(ch)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:12, textAlign:'left',
                background: isMapped ? `${SUBJ_COLOR[subject]}14` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isMapped ? SUBJ_COLOR[subject]+'44' : 'rgba(255,255,255,0.06)'}` }}>
              {isMapped ? <CheckSquare size={16} color={SUBJ_COLOR[subject]}/> : <Square size={16} color="#475569"/>}
              <span style={{ fontSize:13, fontWeight:500, color: isMapped ? '#f1f5f9' : '#94a3b8' }}>{ch.title}</span>
            </button>
          );
        })}
      </div>

      <button onClick={onClose}
        style={{ width:'100%', marginTop:16, padding:'13px 0', borderRadius:14, fontSize:14, fontWeight:700, color:'#fff',
          background:'linear-gradient(135deg,#3b82f6,#2563eb)', border:'none' }}>
        Done
      </button>
    </BottomSheet>
  );
}
