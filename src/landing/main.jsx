import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { resolvePath } from '../shared/base-path.js';
import { NavBar } from '../shared/components/NavBar.jsx';
import { ChapterNav } from './ChapterNav.jsx'; // Imported new component

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

  // Track active section based on scroll position
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
    <div style={{ backgroundColor: 'var(--mantine-color-dark-9)' }}>
      {/* Top Chapter Navigation */}
      <ChapterNav sections={sections} activeId={activeId} onNavigate={handleNavigate} />
      
      {/* Bottom Global Navigation */}
      <NavBar />
      
      {sections.map((sec) => (
        <motion.section
          id={sec.id}
          key={sec.id}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`snap-section theme-${sec.theme}`}
          style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <motion.div 
            className="visual-wrapper" 
            style={{ backgroundImage: `url(${resolvePath('images/' + (sec.image || ''))})` }}
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <div className="content-wrapper" style={{ position: 'relative', zIndex: 10 }}>
            <motion.span className="kicker">{sec.kicker}</motion.span>
            <motion.h2 className="editorial-title">{sec.title}</motion.h2>
            <motion.p className="editorial-body">{sec.content}</motion.p>
          </div>
        </motion.section>
      ))}
    </div>
  );
}

const root = createRoot(document.getElementById('main-content'));
root.render(<CinematicLanding />);