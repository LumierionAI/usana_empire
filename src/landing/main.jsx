import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { resolvePath } from '../shared/base-path.js';
import { NavBar } from '../shared/components/NavBar.jsx';
import { ChapterNav } from './ChapterNav.jsx';
import { IconArrowDown } from '@tabler/icons-react';

function CinematicLanding() {
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState('');
  const { scrollY } = useScroll();

  useEffect(() => {
    fetch(resolvePath('content/sections.json'))
      .then(res => res.json())
      .then(data => {
        setSections(data);
        if(data.length > 0) setActiveId(data[0].id);
      })
      .catch(err => console.error("Failed to load sections:", err));
  }, []);

  useMotionValueEvent(scrollY, "change", () => {
    const sectionElements = sections.map(s => document.getElementById(s.id)).filter(Boolean);
    const viewportCenter = window.scrollY + (window.innerHeight / 2);
    
    let currentActive = activeId;
    sectionElements.forEach(el => {
      const { offsetTop, offsetHeight } = el;
      if (viewportCenter >= offsetTop && viewportCenter <= offsetTop + offsetHeight) {
        currentActive = el.id;
      }
    });
    
    if (currentActive !== activeId) setActiveId(currentActive);
  });

  const handleNavigate = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: 'var(--color-near-black)' }}>
      <ChapterNav sections={sections} activeId={activeId} onNavigate={handleNavigate} />
      <NavBar />
      
      {sections.map((sec, index) => {
        const nextSec = sections[index + 1];

        return (
          <motion.section
            id={sec.id}
            key={sec.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.8 }}
            className={`snap-section theme-${sec.theme}`}
          >
            {/* Background Visual Environment */}
            <motion.div 
              className="visual-wrapper" 
              style={{ backgroundImage: `url(${resolvePath('images/' + (sec.image || ''))})` }}
              initial={{ scale: 1.05 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
            
            {/* Dark Gradient Overlay for Text Legibility */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2,
              background: 'linear-gradient(90deg, rgba(5,8,20,0.95) 0%, rgba(5,8,20,0.85) 45%, rgba(5,8,20,0.4) 100%)'
            }} />

            {/* Responsive Layout wrapper controlled by styles/landing.css */}
            <div className="split-layout">
              
              <motion.div 
                className="chapter-content"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="kicker">
                  {sec.kicker}
                </span>
                
                <h2 className="editorial-title" style={{ color: 'var(--color-white)' }}>
                  {sec.title}
                </h2>

                <p 
                  className="editorial-body" 
                  style={{ color: 'var(--color-gray-300)' }}
                  dangerouslySetInnerHTML={{ __html: sec.content }}
                />

                {/* Chapter 01 Primary Interaction */}
                {sec.id === 'the-question' && nextSec && (
                  <button 
                    onClick={() => handleNavigate(nextSec.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', fontFamily: 'var(--font-ui)', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0, marginTop: '1rem' }}
                  >
                    <span style={{ borderBottom: '1px solid var(--color-biological-teal)', paddingBottom: '2px' }}>Explore the science</span>
                    <IconArrowDown size={16} color="var(--color-biological-teal)" />
                  </button>
                )}

                {/* Chapter 07 Gamified Conversion Buttons */}
                {sec.id === 'explore-products' && (
                  <motion.div 
                    className="cta-group" 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    <motion.a 
                      href={resolvePath('app/product/')}
                      className="btn-gamified btn-primary"
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(26, 86, 219, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Explore Products
                    </motion.a>
                    
                    <motion.a 
                      href="https://empires.usana.com" target="_blank" rel="noopener noreferrer"
                      className="btn-gamified btn-secondary"
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(13, 148, 136, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Buy Now
                    </motion.a>
                    
                    <motion.a 
                      href={resolvePath('app/tools/guidance/')}
                      className="btn-gamified btn-outline"
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Get Product Guidance
                    </motion.a>
                  </motion.div>
                )}
              </motion.div>

              {/* Empty div reserves the right column for the split layout to push text left */}
              <div />
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}

const root = createRoot(document.getElementById('main-content'));
root.render(<CinematicLanding />);