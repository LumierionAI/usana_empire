import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolvePath } from '../base-path.js';
import { IconPill, IconDroplets, IconBriefcase, IconStethoscope } from '@tabler/icons-react';

const NavLink = ({ href, text, icon: Icon }) => (
  <motion.a
    href={href}
    style={{
      position: 'relative',
      color: 'var(--color-gray-300)',
      textDecoration: 'none',
      fontFamily: 'var(--font-ui), "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '0.85rem',
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      padding: '1.5rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    whileHover="hover"
    initial="initial"
  >
    <motion.span
      variants={{
        initial: { color: 'var(--color-gray-300)', textShadow: 'none' },
        hover: { color: 'var(--color-white)', textShadow: '0 0 10px rgba(255, 255, 255, 0.6)' }
      }}
      transition={{ duration: 0.2 }}
    >
      <span className="desktop-only">{text}</span>
      <span className="mobile-only" style={{ display: 'flex' }}><Icon size={24} stroke={1.5} /></span>
    </motion.span>
    
    <motion.div
      variants={{ initial: { scaleX: 0, opacity: 0 }, hover: { scaleX: 1, opacity: 1 } }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'absolute', bottom: '0', left: 0, right: 0, height: '3px',
        backgroundColor: 'var(--color-biological-teal)',
        boxShadow: '0 -2px 10px var(--color-biological-teal)',
        originX: 0.5, borderRadius: '3px 3px 0 0'
      }}
    />
  </motion.a>
);

export function NavBar() {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const pressTimer = useRef(null);

  const startPress = () => { pressTimer.current = setTimeout(() => setShowWorkspace(true), 3000); };
  const cancelPress = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };
  const handleHomeClick = (e) => { showWorkspace ? setShowWorkspace(false) : window.location.href = resolvePath(''); };

  return (
    <nav
      className="global-navbar-docked"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', zIndex: 50,
        backgroundColor: 'rgba(5, 8, 20, 0.85)', backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(13, 148, 136, 0.3)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}
    >
      <div className="bottom-nav-grid">
        
        {/* LEFT COMPARTMENT */}
        <div className="nav-compartment-left">
          <NavLink href={resolvePath('app/product/')} text="Nutritionals" icon={IconPill} />
          <NavLink href={resolvePath('app/product/')} text="Skincare" icon={IconDroplets} />
        </div>

        {/* CENTER COMPARTMENT */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 60 }}>
          <AnimatePresence>
            {showWorkspace && (
              <motion.a
                href={resolvePath('app/tools/')}
                initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }}
                style={{
                  position: 'absolute', top: '-70px', backgroundColor: 'rgba(13, 148, 136, 0.95)', color: 'white',
                  padding: '0.75rem 1.25rem', borderRadius: '2rem', textDecoration: 'none',
                  fontFamily: 'var(--font-ui), sans-serif', fontWeight: 600, fontSize: '0.85rem',
                  letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 5px 25px rgba(13, 148, 136, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.3)', whiteSpace: 'nowrap', cursor: 'pointer'
                }}
              >
                Access Workspace
              </motion.a>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(13, 148, 136, 0.8)' }} whileTap={{ scale: 0.95 }}
            onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
            onTouchStart={startPress} onTouchEnd={cancelPress} onClick={handleHomeClick}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '64px', height: '64px', backgroundColor: 'rgba(10, 17, 40, 0.95)',
              border: '2px solid var(--color-biological-teal)', borderRadius: '50%',
              boxShadow: '0 0 15px rgba(13, 148, 136, 0.4)', marginTop: '-40px',
              cursor: 'pointer', outline: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none'
            }}
          >
            <img src={resolvePath('favicon.svg')} alt="Home" style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))', pointerEvents: 'none' }} />
          </motion.div>
        </div>

        {/* RIGHT COMPARTMENT */}
        <div className="nav-compartment-right">
          <NavLink href={resolvePath('app/business/')} text="Business" icon={IconBriefcase} />
          <NavLink href={resolvePath('app/tools/guidance/')} text="Guidance" icon={IconStethoscope} />
        </div>

      </div>
    </nav>
  );
}