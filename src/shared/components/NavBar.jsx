import React from 'react';
import { motion } from 'framer-motion';
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
    {/* Text Glow Effect */}
    <motion.span
      variants={{
        initial: { color: 'var(--color-gray-300)', textShadow: 'none' },
        hover: { color: 'var(--color-white)', textShadow: '0 0 10px rgba(255, 255, 255, 0.6)' }
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
    
    {/* Bottom Neon Accent Line */}
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
      {/* 3-Column Symmetrical Grid Layout */}
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
          <motion.a
            href={resolvePath('')}
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(13, 148, 136, 0.8)' }}
            whileTap={{ scale: 0.95 }}
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
              marginTop: '-40px', // Forces the circle to pop out above the navbar line
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Return to Base"
          >
            <img 
              src={resolvePath('favicon.svg')} 
              alt="Home" 
              style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' }} 
            />
          </motion.a>
        </div>

        {/* RIGHT COMPARTMENT: Business & Systems */}
        <div style={{ display: 'flex', gap: '3rem', justifyContent: 'flex-start', paddingLeft: '4rem' }}>
          <NavLink href={resolvePath('app/business/')}>Business</NavLink>
          <NavLink href={resolvePath('app/tools/')}>Workspace</NavLink>
        </div>

      </div>
    </nav>
  );
}