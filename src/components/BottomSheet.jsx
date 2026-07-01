import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children, maxHeight = '85vh' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.6)' }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={onClose}>
          <motion.div
            onClick={e => e.stopPropagation()}
            style={{
              background:'#0f172a', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:560,
              maxHeight, display:'flex', flexDirection:'column', border:'1px solid rgba(255,255,255,0.07)',
            }}
            initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:30, stiffness:300 }}>
            <div className="sheet-handle"/>
            {title && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>{title}</h3>
                <button onClick={onClose} style={{ padding:6, borderRadius:8, background:'rgba(255,255,255,0.06)', border:'none' }}>
                  <X size={16} color="#94a3b8"/>
                </button>
              </div>
            )}
            <div className="hide-scrollbar safe-bottom" style={{ overflowY:'auto', padding:'16px 20px 24px' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
