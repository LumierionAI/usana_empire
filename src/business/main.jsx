import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { resolvePath } from '../shared/base-path.js';
import { NavBar } from '../shared/components/NavBar.jsx';

function BusinessOpportunity() {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetch(resolvePath('content/compensation.json'))
      .then(res => res.json())
      .then(data => setSections(data))
      .catch(err => console.error("Failed to load business plan content:", err));
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--mantine-color-dark-9)', minHeight: '100vh', color: 'white' }}>
      <NavBar />
      
      <main className="snap-container">
        {sections.map((sec, index) => (
          <motion.section
            key={sec.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`snap-section theme-${sec.theme} layout-${sec.layout}`}
            style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}
          >
            <div className="data-heavy-section" style={{ maxWidth: '1200px', width: '100%' }}>
              <div className="content-wrapper" style={{ textAlign: sec.layout === 'center' ? 'center' : 'left', marginBottom: '3rem' }}>
                <motion.span 
                  className="kicker" 
                  style={{ justifyContent: sec.layout === 'center' || sec.layout === 'split' ? 'center' : 'flex-start' }}
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }}
                >
                  {sec.kicker}
                </motion.span>
                <motion.h2 
                  className="editorial-title"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                >
                  {sec.title}
                </motion.h2>
                <motion.p 
                  className="editorial-body"
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }}
                >
                  {sec.content}
                </motion.p>
              </div>

              {sec.cards && sec.cards.length > 0 && (
                <div className="business-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                  {sec.cards.map((card, idx) => (
                    <motion.div 
                      key={idx} 
                      className="comp-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 + (idx * 0.1) }}
                      style={{ 
                        background: 'rgba(25, 27, 31, 0.6)', 
                        padding: '2rem', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <div className="comp-card-title" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--mantine-color-blue-4)' }}>
                        {card.title}
                      </div>
                      <p className="comp-card-body" style={{ color: 'var(--mantine-color-gray-3)', lineHeight: 1.6 }}>
                        {card.body}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('main-content'));
root.render(<BusinessOpportunity />);