import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CalendarPlus, BookOpen, Target } from 'lucide-react';

const ACTIONS = [
  { id:'task',    label:'Daily Task',      icon:CalendarPlus, color:'#3b82f6' },
  { id:'chapter', label:'Monthly Chapter', icon:BookOpen,     color:'#a855f7' },
  { id:'mock',    label:'Mock Test',       icon:Target,       color:'#ef4444' },
];

/**
 * FabMenu — Fix #10: the old page had both a redundant "+ Add" text
 * button next to "Today's Tasks" AND a separate floating "+" circle,
 * with the floating one only doing one thing (add a daily task). This
 * replaces both with a single FAB that expands into three real options.
 */
export default function FabMenu({ open, setOpen, onAction, themeColor='#3b82f6', themeGlow='#3b82f680' }) {
  return (
    <div style={{ position:'fixed', bottom:96, right:20, zIndex:35, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
      <AnimatePresence>
        {open && ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              onClick={() => { onAction(action.id); setOpen(false); }}
              initial={{ opacity:0, y:12, scale:0.85 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:12, scale:0.85 }}
              transition={{ delay: i*0.04, type:'spring', stiffness:400, damping:26 }}
              style={{ display:'flex', alignItems:'center', gap:10, background:'#0f172a',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:99, padding:'8px 8px 8px 16px',
                boxShadow:'0 6px 20px rgba(0,0,0,0.4)' }}
            >
              <span style={{ fontSize:12.5, fontWeight:700, color:'#e2e8f0', whiteSpace:'nowrap' }}>{action.label}</span>
              <span style={{ width:34, height:34, borderRadius:'50%', background:`${action.color}22`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={16} color={action.color}/>
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(o => !o)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type:'spring', stiffness:400, damping:24 }}
        style={{ width:56, height:56, borderRadius:'50%', background: themeColor, border:'none',
          display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 22px ${themeGlow}` }}
      >
        <Plus size={26} color="#fff"/>
      </motion.button>

      {/* Tap-outside-to-close overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:-1 }}/>
      )}
    </div>
  );
}
