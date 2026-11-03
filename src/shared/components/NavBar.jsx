import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolvePath } from '../base-path.js';

// Reusable Gamified Nav Link Component
const NavLink = ({ href, children }) => (
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
      alignItems: 'center'
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
      {children}
    </motion.span>
    
    <motion.div
      variants={{
        initial: { scaleX: 0, opacity: 0 },
        hover: { scaleX: 1, opacity: 1 }
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        bottom: '0', 
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: 'var(--color-biological-teal)',
        boxShadow: '0 -2px 10px var(--color-biological-teal)',
        originX: 0.5,
        borderRadius: '3px 3px 0 0'
      }}
    />
  </motion.a>
);

export function NavBar() {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const pressTimer = useRef(null);

  // Interaction handlers for the 3-second long press
  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      setShowWorkspace(true);
    }, 3000);
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleHomeClick = (e) => {
    if (showWorkspace) {
      // If the menu is open, clicking the button again just closes it
      setShowWorkspace(false);
    } else {
      // Short press immediately routes to the home/hero page
      window.location.href = resolvePath('');
    }
  };

  return (
    <nav
      className="global-navbar-docked"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        zIndex: 50,
        backgroundColor: 'rgba(5, 8, 20, 0.85)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(13, 148, 136, 0.3)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        alignItems: 'center',
        padding: '0 2rem'
      }}>
        
        {/* LEFT COMPARTMENT: Products */}
        <div style={{ display: 'flex', gap: '3rem', justifyContent: 'flex-end', paddingRight: '4rem' }}>
          <NavLink href={resolvePath('app/product/')}>Nutritionals</NavLink>
          <NavLink href={resolvePath('app/product/')}>Skincare</NavLink>
        </div>

        {/* CENTER COMPARTMENT: Pop-out Gamified Home Node */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 60 }}>
          
          {/* Secret Workspace Popup */}
          <AnimatePresence>
            {showWorkspace && (
              <motion.a
                href={resolvePath('app/tools/')}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                style={{
                  position: 'absolute',
                  top: '-70px',
                  backgroundColor: 'rgba(13, 148, 136, 0.95)',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '2rem',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-ui), sans-serif',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  boxShadow: '0 5px 25px rgba(13, 148, 136, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                Access Workspace
              </motion.a>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(13, 148, 136, 0.8)' }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onClick={handleHomeClick}
            onContextMenu={(e) => e.preventDefault()} // Prevents native long-press menus on mobile
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(10, 17, 40, 0.95)',
              border: '2px solid var(--color-biological-teal)',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(13, 148, 136, 0.4)',
              marginTop: '-40px',
              cursor: 'pointer',
              outline: 'none',
              // Disables touch callouts and text selection to ensure a clean long-press
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
            title="Hold for 3 seconds for Workspace, Tap for Home"
          >
            <img 
              src={resolvePath('favicon.svg')} 
              alt="Home" 
              style={{ 
                width: '32px', 
                height: '32px', 
                filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))',
                pointerEvents: 'none' // Ensures the image doesn't steal the mouse events
              }} 
            />
          </motion.div>
        </div>

        {/* RIGHT COMPARTMENT: Business & Guidance */}
        <div style={{ display: 'flex', gap: '3rem', justifyContent: 'flex-start', paddingLeft: '4rem' }}>
          <NavLink href={resolvePath('app/business/')}>Business</NavLink>
          <NavLink href={resolvePath('app/tools/guidance/')}>Guidance</NavLink>
        </div>

      </div>
    </nav>
  );
}