import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMenu2, IconX, IconCircleCheck, IconCircle } from '@tabler/icons-react';

export function ChapterNav({ sections, activeId, onNavigate }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeIndex = sections.findIndex(s => s.id === activeId);

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
        padding: '1rem',
        pointerEvents: 'none' // Allows clicking through empty space
      }}
    >
      <motion.div
        layout
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: isExpanded ? '1.5rem' : '0.5rem 1rem',
          width: isExpanded ? '100%' : 'auto',
          maxWidth: '800px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '56px' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Compact View Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '40px' }}>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {isExpanded ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </button>
          
          {!isExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1 }}>
              {sections.map((sec, idx) => {
                const isActive = idx === activeIndex;
                const isPast = idx < activeIndex;
                return (
                  <React.Fragment key={sec.id}>
                    <div 
                      onClick={() => onNavigate(sec.id)}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        opacity: isActive ? 1 : (isPast ? 0.7 : 0.3),
                        transition: 'opacity 0.3s'
                      }}
                    >
                      {isPast ? <IconCircleCheck size={16} color="var(--mantine-color-teal-4)" /> : <IconCircle size={16} fill={isActive ? 'white' : 'transparent'} />}
                      {isActive && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>{sec.title}</span>}
                    </div>
                    {idx < sections.length - 1 && (
                      <div style={{ height: '1px', flexGrow: 1, minWidth: '20px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
          {isExpanded && <span style={{ fontWeight: 600, color: 'white' }}>Chapter Index</span>}
        </div>

        {/* Expanded View Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}
            >
              {sections.map((sec, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div 
                    key={sec.id}
                    onClick={() => {
                      onNavigate(sec.id);
                      setIsExpanded(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '1rem',
                      padding: '1rem', borderRadius: '1rem', cursor: 'pointer',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ color: isActive ? 'var(--mantine-color-teal-4)' : 'var(--mantine-color-gray-5)', fontWeight: 700, fontSize: '1.2rem' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{sec.title}</div>
                      <div style={{ color: 'var(--mantine-color-gray-4)', fontSize: '0.9rem', lineHeight: 1.4 }}>{sec.kicker}</div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}