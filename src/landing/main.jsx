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
            style={{ position: 'relative', overflow: 'hidden', height: '100vh' }}
          >
            {/* Background Visual Environment */}
            <motion.div 
              className="visual-wrapper" 
              style={{ 
                backgroundImage: `url(${resolvePath('images/' + (sec.image || ''))})`,
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1
              }}
              initial={{ scale: 1.05 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2,
              background: 'linear-gradient(90deg, rgba(5,8,20,0.95) 0%, rgba(5,8,20,0.85) 45%, rgba(5,8,20,0.4) 100%)'
            }} />

            {/* Split Layout */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', alignItems: 'center', height: '100vh', padding: '0 4vw' }}>
              
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', paddingRight: '2rem' }}
              >
                <span className="kicker" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-biological-teal)', letterSpacing: '3px', marginBottom: '1.25rem' }}>
                  {sec.kicker}
                </span>
                
                <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.75rem, 4vw, 4.5rem)', lineHeight: '1.05', fontWeight: 400, color: 'var(--color-white)', margin: '0 0 1.25rem 0' }}>
                  {sec.title}
                </h2>

                <p 
                  className="editorial-body" 
                  style={{ fontFamily: 'var(--font-ui)', fontSize: 'clamp(1rem, 1.1vw, 1.15rem)', lineHeight: '1.6', color: 'var(--color-gray-300)', maxWidth: '540px', margin: '0 0 2rem 0', fontWeight: 300 }}
                  dangerouslySetInnerHTML={{ __html: sec.content }}
                />

                {/* Chapter 01 Primary Interaction */}
                {sec.id === 'the-question' && nextSec && (
                  <button 
                    onClick={() => handleNavigate(nextSec.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', fontFamily: 'var(--font-ui)', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}
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
                    style={{ display: 'flex', gap: '1.25rem', marginTop: '1.5rem', flexWrap: 'wrap' }}
                  >
                    <motion.a 
                      href={resolvePath('app/product/')}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(26, 86, 219, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        fontFamily: 'var(--font-ui)', fontSize: '0.95rem', padding: '0.85rem 2rem', borderRadius: '2rem', 
                        backgroundColor: 'var(--color-scientific-blue)', color: 'white', textDecoration: 'none', 
                        fontWeight: 600, letterSpacing: '0.5px', border: '1px solid transparent'
                      }}
                    >
                      Explore Products
                    </motion.a>
                    
                    <motion.a 
                      href="https://empires.usana.com" target="_blank" rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(13, 148, 136, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        fontFamily: 'var(--font-ui)', fontSize: '0.95rem', padding: '0.85rem 2rem', borderRadius: '2rem', 
                        backgroundColor: 'var(--color-biological-teal)', color: 'white', textDecoration: 'none', 
                        fontWeight: 600, letterSpacing: '0.5px', border: '1px solid transparent'
                      }}
                    >
                      Buy Now
                    </motion.a>
                    
                    <motion.a 
                      href={resolvePath('app/tools/guidance/')}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        fontFamily: 'var(--font-ui)', fontSize: '0.95rem', padding: '0.85rem 2rem', borderRadius: '2rem', 
                        backgroundColor: 'transparent', color: 'var(--color-white)', textDecoration: 'none', 
                        fontWeight: 600, letterSpacing: '0.5px', border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      Get Product Guidance
                    </motion.a>
                  </motion.div>
                )}
              </motion.div>

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