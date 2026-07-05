import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, BookOpen, BarChart3, Timer, Trophy } from 'lucide-react';

const TABS = [
  { to:'/',          icon:Home,         label:'Today'    },
  { to:'/calendar',  icon:CalendarDays, label:'Calendar' },
  { to:'/syllabus',  icon:BookOpen,     label:'Syllabus' },
  { to:'/progress',  icon:BarChart3,    label:'Progress' },
  { to:'/timer',     icon:Timer,        label:'Timer'    },
  { to:'/ranking',   icon:Trophy,       label:'Rank'     },
];

export default function BottomNav({ themeHex = '#3b82f6' }) {
  return (
    <nav className="safe-bottom" style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      display:'flex', background:'rgba(11,17,32,0.95)', backdropFilter:'blur(16px)',
      borderTop:'1px solid rgba(255,255,255,0.06)',
    }}>
      {TABS.map(({ to, icon:Icon, label }) => (
        <NavLink key={to} to={to} end={to==='/'}
          style={({ isActive }) => ({
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            padding:'8px 0 6px', textDecoration:'none', minWidth:0,
            borderTop: isActive ? `2px solid ${themeHex}` : '2px solid transparent',
          })}>
          {({ isActive }) => (
            <>
              <Icon size={18} color={isActive ? themeHex : '#64748b'} strokeWidth={isActive ? 2.4 : 2}/>
              <span style={{ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.02em',
                color: isActive ? themeHex : '#64748b', whiteSpace:'nowrap' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
