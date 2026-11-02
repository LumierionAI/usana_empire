import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { resolvePath } from '../base-path.js';

export function NavBar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    // Hide nav if scrolling down and past the 150px threshold, show if scrolling up
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.nav
      className="global-navbar"
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "150%", opacity: 0 } // Pushes down off-screen when hiding
      }}
      initial="visible"
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        bottom: '2rem', // Anchored to bottom per HeroDesign.md
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none' // Allows clicking through the invisible full-width container wrapper
      }}
    >
      <div 
        className="nav-container"
        style={{
          pointerEvents: 'auto', // Re-enables clicking on the actual navigation pill
          display: 'flex',
          alignItems: 'center',
          gap: '3rem',
          backgroundColor: 'rgba(15, 23, 42, 0.65)', // Deep navy premium styling
          backdropFilter: 'blur(16px)',
          padding: '0.85rem 2.5rem',
          borderRadius: '4rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        <a href={resolvePath('')} className="nav-brand" style={{ color: 'white', fontWeight: 600, letterSpacing: '0.5px', textDecoration: 'none', fontSize: '1.1rem' }}>
          USANA Empire
        </a>
        <ul className="nav-links" style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><a href={resolvePath('app/product/')} style={{ color: 'var(--mantine-color-gray-3)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Product</a></li>
          <li><a href={resolvePath('app/business/')} style={{ color: 'var(--mantine-color-gray-3)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Business</a></li>
          <li><a href={resolvePath('app/tools/')} style={{ color: 'var(--mantine-color-blue-4)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}>Workspace</a></li>
        </ul>
      </div>
    </motion.nav>
  );
}