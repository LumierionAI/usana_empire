import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Geometric Icons (Self-Contained & Flex-Safe)
const IconFocus = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

const IconHexagon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <path d="M21 16.008V7.992c0-.773-.404-1.468-1.053-1.838l-6.84-3.882a2.08 2.08 0 0 0-2.113 0l-6.84 3.882A2.094 2.094 0 0 0 3 7.992v8.016c0 .773.404 1.468 1.053 1.838l6.84 3.882a2.08 2.08 0 0 0 2.113 0l6.84-3.882c.65-.37 1.054-1.065 1.054-1.838z" />
  </svg>
);

const IconNetwork = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="18" r="3" />
    <line x1="8.5" y1="10.5" x2="15.5" y2="7.5" />
    <line x1="8.5" y1="13.5" x2="15.5" y2="16.5" />
  </svg>
);

const IconOrganic = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <path d="M12 22c5.523 0 10-4.477 10-10 0-5.523-4.477-10-10-10S2 6.477 2 12c0 5.523 4.477 10 10 10z" />
    <path d="M12 2v20" />
    <path d="M12 12c2.5 0 5-1.5 5-4" />
    <path d="M12 16c-2.5 0-5-1.5-5-4" />
  </svg>
);

const IconStructure = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" fill={color} />
  </svg>
);

const IconValid = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconAction = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const chaptersMeta = [
  { icon: IconFocus, label: 'Question' },
  { icon: IconHexagon, label: 'Cellular' },
  { icon: IconNetwork, label: 'Systems' },
  { icon: IconOrganic, label: 'Nutrition' },
  { icon: IconStructure, label: 'Support' },
  { icon: IconValid, label: 'Difference' },
  { icon: IconAction, label: 'Explore' }
];

export function ChapterNav({ sections = [], activeId, onNavigate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const activeIndex = sections.findIndex(s => s.id === activeId);
  const safeActiveIndex = activeIndex !== -1 ? activeIndex : 0;

  const handleSelectChapter = (id) => {
    if (typeof onNavigate === 'function') onNavigate(id);
    setIsExpanded(false);
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        padding: '1.25rem 1rem',
        pointerEvents: 'none'
      }}
    >
      <motion.div
        layout
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'rgba(10, 17, 40, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '4rem',
          padding: isExpanded ? '1.5rem' : '0.5rem 0.75rem',
          width: isExpanded ? '100%' : 'auto',
          maxWidth: isExpanded ? '600px' : 'none',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
        initial={false}
        animate={{ borderRadius: isExpanded ? '1.5rem' : '4rem' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--color-white)', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem',
              outline: 'none'
            }}
            title="Toggle Chapter Index"
          >
            {isExpanded ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
            )}
          </button>
          
          {!isExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.25rem' }}>
              {sections.map((sec, idx) => {
                const isActive = idx === safeActiveIndex;
                const isPast = idx < safeActiveIndex;
                const meta = chaptersMeta[idx] || chaptersMeta[0];
                const IconComponent = meta.icon;

                return (
                  <button 
                    key={sec.id || idx}
                    onClick={() => handleSelectChapter(sec.id)}
                    style={{ 
                      backgroundColor: isActive ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
                      border: isActive ? '1px solid rgba(13, 148, 136, 0.5)' : '1px solid transparent',
                      boxShadow: isActive ? '0 0 15px rgba(13, 148, 136, 0.35)' : 'none',
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: isActive ? '0.4rem 0.85rem' : '0.4rem 0.5rem',
                      borderRadius: '2rem',
                      opacity: isActive ? 1 : (isPast ? 0.6 : 0.3),
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      color: isActive ? 'var(--color-biological-teal)' : 'var(--color-white)',
                      outline: 'none',
                      lineHeight: 1
                    }}
                    title={sec.title}
                  >
                    <IconComponent size={16} color={isActive ? 'var(--color-biological-teal)' : 'currentColor'} />
                    {isActive && (
                      <span 
                        className="desktop-only"
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          fontFamily: 'var(--font-mono)', 
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          color: 'var(--color-biological-teal)'
                        }}
                      >
                        {meta.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {isExpanded && <span style={{ fontWeight: 600, color: 'white', fontFamily: 'var(--font-ui)', letterSpacing: '0.5px', marginTop: '2px' }}>Chapter Index</span>}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}
            >
              {sections.map((sec, idx) => {
                const isActive = idx === safeActiveIndex;
                const meta = chaptersMeta[idx] || chaptersMeta[0];
                const IconComponent = meta.icon;
                
                return (
                  <button 
                    key={sec.id || idx}
                    onClick={() => handleSelectChapter(sec.id)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: '1.25rem',
                      padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer',
                      backgroundColor: isActive ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
                      border: isActive ? '1px solid rgba(13, 148, 136, 0.4)' : '1px solid transparent',
                      boxShadow: isActive ? '0 0 20px rgba(13, 148, 136, 0.2)' : 'none',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ color: isActive ? 'var(--color-biological-teal)' : 'var(--color-gray-500)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <IconComponent size={24} color={isActive ? 'var(--color-biological-teal)' : 'currentColor'} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ color: isActive ? 'white' : 'var(--color-gray-300)', fontWeight: 400, fontSize: '1.25rem', fontFamily: 'var(--font-editorial)', lineHeight: 1.2 }}>{sec.title}</div>
                      <div style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '0.35rem' }}>{sec.kicker}</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}