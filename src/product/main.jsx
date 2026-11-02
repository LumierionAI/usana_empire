import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { resolvePath } from '../shared/base-path.js';
import { NavBar } from '../shared/components/NavBar.jsx';

function ProductPortfolio() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('nutritionals');

  useEffect(() => {
    fetch(resolvePath('content/products.json'))
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to load product portfolio:", err));
  }, []);

  const displayData = products.filter(p => p.category === activeCategory);

  return (
    <div style={{ backgroundColor: 'var(--mantine-color-dark-9)', minHeight: '100vh', color: 'white' }}>
      <NavBar />
      
      {/* Category Toggles - Adapted for React State */}
      <div 
        className="view-toggles" 
        style={{ 
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 40, display: 'flex', gap: '0.5rem', 
          backgroundColor: 'rgba(25, 27, 31, 0.75)', padding: '0.5rem', 
          borderRadius: '2rem', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' 
        }}
      >
        <button 
          className={`toggle-btn ${activeCategory === 'nutritionals' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('nutritionals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{
            background: activeCategory === 'nutritionals' ? 'var(--mantine-color-blue-filled)' : 'transparent',
            color: activeCategory === 'nutritionals' ? 'white' : 'var(--mantine-color-gray-4)',
            border: 'none', padding: '0.5rem 1.5rem', borderRadius: '1.5rem', cursor: 'pointer', 
            fontWeight: 600, transition: 'all 0.3s ease'
          }}
        >
          Nutritionals
        </button>
        <button 
          className={`toggle-btn ${activeCategory === 'celavive' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('celavive'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{
            background: activeCategory === 'celavive' ? 'var(--mantine-color-blue-filled)' : 'transparent',
            color: activeCategory === 'celavive' ? 'white' : 'var(--mantine-color-gray-4)',
            border: 'none', padding: '0.5rem 1.5rem', borderRadius: '1.5rem', cursor: 'pointer', 
            fontWeight: 600, transition: 'all 0.3s ease'
          }}
        >
          Celavive Skincare
        </button>
      </div>

      <main className="snap-container" style={{ paddingTop: '100px' }}>
        {displayData.map((p) => (
          <motion.section
            key={p.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="snap-section"
            style={{ 
              minHeight: '85vh', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', padding: '4rem 2rem', gap: '4rem',
              maxWidth: '1200px', margin: '0 auto'
            }}
          >
            <motion.div 
              className="visual-wrapper"
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
              style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
            >
              <a href={p.buyLink || '#'} target="_blank" rel="noopener noreferrer" className="product-image-link" title={`Click to purchase ${p.name}`}>
                <img 
                  src={resolvePath('images/' + (p.image || 'favicon.svg'))} 
                  alt={p.name} 
                  loading="lazy" 
                  style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.4))' }} 
                />
              </a>
            </motion.div>

            <div className="content-wrapper" style={{ flex: 1 }}>
              <motion.span className="kicker" style={{ color: 'var(--mantine-color-blue-4)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.875rem', fontWeight: 700 }}>
                {p.kicker}
              </motion.span>
              <motion.h2 className="editorial-title" style={{ fontSize: '3.5rem', lineHeight: 1.1, margin: '1rem 0', fontFamily: 'var(--mantine-font-family-headings)' }}>
                {p.name}
              </motion.h2>
              <motion.p className="editorial-body" style={{ fontSize: '1.125rem', lineHeight: 1.6, color: 'var(--mantine-color-gray-3)', marginBottom: '2.5rem' }}>
                {p.overview}
              </motion.p>
              
              <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="benefits-block">
                  <h4 style={{ color: 'var(--mantine-color-gray-0)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>Core Benefits</h4>
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--mantine-color-gray-4)', lineHeight: 1.6 }}>
                    {p.benefits.map((b, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{b}</li>)}
                  </ul>
                </div>
                <div className="ideal-block">
                  <h4 style={{ color: 'var(--mantine-color-gray-0)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>Ideal For</h4>
                  <div className="ideal-for-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {p.idealFor.map((tag, i) => (
                      <span key={i} className="ideal-tag" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.875rem', color: 'var(--mantine-color-gray-1)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        ))}
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('main-content'));
root.render(<ProductPortfolio />);