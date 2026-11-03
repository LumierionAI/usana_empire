import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, AppShell, Group, Title, Text, Button, ActionIcon,
  Container, Paper, Stack, Avatar, Loader, Center, Alert,
  Grid, Badge, ScrollArea, TextInput, Card, Divider, ThemeIcon,
  SegmentedControl, useMantineColorScheme, useComputedColorScheme
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSun, IconMoon, IconAlertCircle, IconArrowRight, IconArrowLeft,
  IconSearch, IconStethoscope, IconDownload, IconPrinter,
  IconSalad, IconBarbell, IconUpload, IconCopy, IconPhoto,
  IconPill, IconDroplets, IconBriefcase
} from '@tabler/icons-react';

import '@mantine/core/styles.css';
import { resolvePath } from '../../shared/base-path.js';
import { exportToCSV, parseCSV } from '../../shared/import-export/csv.js';

const fadeStyles = {
  animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
};

const printStyles = `
  @media print {
    html, body, #app-mount, .mantine-AppShell-root, .mantine-AppShell-main {
      height: auto !important;
      min-height: auto !important;
      display: block !important;
      position: relative !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    
    .print-auto-height {
      height: auto !important;
      min-height: auto !important;
      display: block !important;
    }

    .no-print { display: none !important; }
    
    .summary-card { 
      box-shadow: none !important; 
      border: 1px solid #e9ecef !important; 
      break-inside: avoid; 
      padding: 20px !important;
      margin-bottom: 20px !important;
      background: white !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    
    * { color: black !important; }
    img { display: block !important; max-width: 100% !important; }
  }
`;

function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';
  return (
    <ActionIcon 
      variant="default" 
      onClick={() => toggleColorScheme()} 
      className="no-print"
      size="lg"
      radius="md"
      title="Toggle color scheme"
    >
      {isDark ? <IconSun size={20} stroke={1.5} /> : <IconMoon size={20} stroke={1.5} />}
    </ActionIcon>
  );
}

// ============================================================================
// ISOLATED GUIDANCE NAVBAR (Strictly locked to Dark Mode colors)
// ============================================================================
const GuidanceNavLink = ({ href, text, icon: Icon, isMobile }) => (
  <motion.a
    href={href}
    style={{
      position: 'relative', color: '#D1D5DB', textDecoration: 'none',
      fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600,
      fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase',
      padding: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}
    whileHover="hover" initial="initial"
  >
    <motion.span
      variants={{
        initial: { color: '#D1D5DB', textShadow: 'none' },
        hover: { color: '#FFFFFF', textShadow: '0 0 10px rgba(255, 255, 255, 0.6)' }
      }}
      transition={{ duration: 0.2 }}
    >
      {isMobile ? <span style={{ display: 'flex' }}><Icon size={24} stroke={1.5} /></span> : <span>{text}</span>}
    </motion.span>
    <motion.div
      variants={{ initial: { scaleX: 0, opacity: 0 }, hover: { scaleX: 1, opacity: 1 } }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'absolute', bottom: '0', left: 0, right: 0, height: '3px',
        backgroundColor: '#0D9488', boxShadow: '0 -2px 10px #0D9488',
        originX: 0.5, borderRadius: '3px 3px 0 0'
      }}
    />
  </motion.a>
);

function GuidanceNavBar() {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const pressTimer = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startPress = () => { pressTimer.current = setTimeout(() => setShowWorkspace(true), 3000); };
  const cancelPress = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };
  const handleHomeClick = () => { showWorkspace ? setShowWorkspace(false) : window.location.href = resolvePath(''); };

  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', zIndex: 50,
        backgroundColor: 'rgba(5, 8, 20, 0.85)', backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(13, 148, 136, 0.3)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}
    >
      <div style={{
        width: '100%', maxWidth: '1200px', display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', 
        padding: isMobile ? '0 1rem' : '0 2rem'
      }}>
        <div style={{ display: 'flex', gap: isMobile ? '2rem' : '3rem', justifyContent: 'flex-end', paddingRight: isMobile ? '1.5rem' : '4rem' }}>
          <GuidanceNavLink href={resolvePath('app/product/')} text="Nutritionals" icon={IconPill} isMobile={isMobile} />
          <GuidanceNavLink href={resolvePath('app/product/')} text="Skincare" icon={IconDroplets} isMobile={isMobile} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 60 }}>
          <AnimatePresence>
            {showWorkspace && (
              <motion.a
                href={resolvePath('app/tools/')}
                initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }}
                style={{
                  position: 'absolute', top: '-70px', backgroundColor: 'rgba(13, 148, 136, 0.95)', color: 'white',
                  padding: '0.75rem 1.25rem', borderRadius: '2rem', textDecoration: 'none',
                  fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.85rem',
                  letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 5px 25px rgba(13, 148, 136, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.3)', whiteSpace: 'nowrap', cursor: 'pointer'
                }}
              >
                Access Workspace
              </motion.a>
            )}
          </AnimatePresence>
          <motion.div
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(13, 148, 136, 0.8)' }} whileTap={{ scale: 0.95 }}
            onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
            onTouchStart={startPress} onTouchEnd={cancelPress} onClick={handleHomeClick}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', 
              backgroundColor: 'rgba(10, 17, 40, 0.95)', border: '2px solid #0D9488', 
              borderRadius: '50%', boxShadow: '0 0 15px rgba(13, 148, 136, 0.4)', marginTop: '-40px',
              cursor: 'pointer', outline: 'none', userSelect: 'none'
            }}
          >
            <img src={resolvePath('favicon.svg')} alt="Home" style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))', pointerEvents: 'none' }} />
          </motion.div>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '2rem' : '3rem', justifyContent: 'flex-start', paddingLeft: isMobile ? '1.5rem' : '4rem' }}>
          <GuidanceNavLink href={resolvePath('app/business/')} text="Business" icon={IconBriefcase} isMobile={isMobile} />
          <GuidanceNavLink href={resolvePath('app/tools/guidance/')} text="Guidance" icon={IconStethoscope} isMobile={isMobile} />
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// GUIDANCE SCREENS
// ============================================================================

function WelcomeScreen({ onNext, onImport }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const fileInputRef = useRef(null);

  return (
    <Stack style={fadeStyles} align="center" justify="center" h="100%" gap="xl" px="md">
      <Avatar src={resolvePath('favicon.svg')} size={80} radius="md" style={{ background: 'transparent' }} mb="md" />
      <Title order={1} ta="center" size="clamp(2rem, 5vw, 3rem)" c={isDark ? 'white' : 'dark.9'} style={{ letterSpacing: '-1px' }}>
        Discover Your Optimal Wellness.
      </Title>
      <Text size="clamp(1rem, 3vw, 1.25rem)" c="dimmed" ta="center" maw={600} mb="xl" style={{ lineHeight: 1.6 }}>
        Answer a few simple questions to receive personalized, science-based nutritional product guidance tailored to your body's unique demands.
      </Text>
      
      <Stack align="center" gap="sm" w="100%">
        <Button 
          size="xl" 
          radius="xl" 
          color="blue" 
          fullWidth
          maw={300}
          rightSection={<IconArrowRight size={20} />} 
          onClick={onNext}
          style={{ transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Start the Experience
        </Button>
        
        <Button 
          variant="subtle" 
          color="gray" 
          size="md"
          fullWidth
          maw={300}
          leftSection={<IconUpload size={18} />}
          onClick={() => fileInputRef.current?.click()}
          mt="sm"
        >
          Restore Guidance (CSV)
        </Button>
        <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={onImport} />
      </Stack>
    </Stack>
  );
}

function FocusQuestion({ state, onSelect, guidanceData, onBack }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [search, setSearch] = useState('');

  const conditions = guidanceData?.conditions || [];
  const filtered = conditions.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack style={fadeStyles} align="center" w="100%" gap={isMobile ? 'md' : 'xl'} mt={isMobile ? 0 : 20} px={isMobile ? 'xs' : 0}>
      <Group w="100%" justify="flex-start">
        <Button variant="subtle" color="gray" size={isMobile ? "sm" : "md"} onClick={onBack} leftSection={<IconArrowLeft size={16} />}>
          Back
        </Button>
      </Group>
      <Title order={2} ta="center" size={isMobile ? "1.8rem" : "2.5rem"} c={isDark ? 'white' : 'dark.9'}>
        What would you like to focus on?
      </Title>
      
      <TextInput
        placeholder="Search wellness goals (e.g., Energy, Immune, Bones)..."
        size={isMobile ? "md" : "lg"}
        w="100%"
        maw={600}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<IconSearch size={20} />}
        radius="md"
      />

      <ScrollArea h={isMobile ? 350 : 400} w="100%" maw={600} type="scroll" offsetScrollbars>
        <Stack gap="sm" pb="xl">
          {filtered.map(c => {
            const isSelected = state.primaryFocus === c.id;
            return (
              <Paper
                key={c.id}
                withBorder
                p={isMobile ? "md" : "lg"}
                radius="md"
                bg={isSelected ? 'blue.6' : (isDark ? 'dark.7' : 'white')}
                c={isSelected ? 'white' : (isDark ? 'gray.3' : 'dark.9')}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => onSelect(c.id)}
                onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'; }}
                onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = isDark ? 'var(--mantine-color-dark-7)' : 'white'; }}
              >
                <Text size={isMobile ? "md" : "lg"} fw={600}>{c.name}</Text>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

const ProductImageBox = ({ product, isDark }) => (
  <div style={{ 
     aspectRatio: '1', width: '100%',
     backgroundColor: isDark ? 'var(--mantine-color-dark-6)' : 'white', 
     borderRadius: '24px', display: 'flex', alignItems: 'center', 
     justifyContent: 'center', padding: '2rem', 
     boxShadow: 'var(--mantine-shadow-xl)',
     border: isDark ? '1px solid var(--mantine-color-dark-4)' : '1px solid var(--mantine-color-gray-2)'
   }}>
      <img src={product?.image} alt={product?.productName} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
   </div>
);

function ProductDiscoveryScreen({ state, setState, guidanceData, productCatalog, onBack, onComplete }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const condition = guidanceData.conditions.find(c => c.id === state.primaryFocus);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const recommendedProducts = useMemo(() => {
     if (!condition) return [];
     return (condition[state.intensity] || []).map(rec => {
       const safeName = (rec.productName || rec.name || '').toLowerCase();
       const rich = productCatalog.find(p => (p.name || '').toLowerCase() === safeName) || {};
       return {
         ...rec,
         productName: rec.productName || rec.name || 'Unknown Product',
         overview: rich.overview || "Premium Nutritional Support.",
         image: rich.image ? resolvePath(`images/${rich.image}`) : resolvePath('favicon.svg')
       };
     });
  }, [condition, state.intensity, productCatalog]);

  if (!condition || recommendedProducts.length === 0) {
    return (
      <Stack align="center" mt={40}>
        <Title order={2}>No guidance found for this selection.</Title>
        <Button onClick={onBack}>Go Back</Button>
      </Stack>
    );
  }

  const activeProduct = recommendedProducts[activeIndex];

  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStart - touchEndX;
    if (distance > 50 && activeIndex < recommendedProducts.length - 1) setActiveIndex(prev => prev + 1);
    if (distance < -50 && activeIndex > 0) setActiveIndex(prev => prev - 1);
    setTouchStart(null);
  };

  if (isMobile) {
    return (
      <Stack style={fadeStyles} h="100%" justify="flex-start" pb="xl" px="xs">
        <Group justify="space-between" mb="xs">
          <Button variant="subtle" color="gray" size="xs" onClick={onBack} leftSection={<IconArrowLeft size={14} />}>Back</Button>
          <Button variant="light" color="blue" size="xs" onClick={onComplete} rightSection={<IconArrowRight size={14} />}>Summary</Button>
        </Group>
        
        <Title order={3} ta="center" size="1.5rem">{condition.name}</Title>
        
        <Center mb="sm">
          <SegmentedControl
            size="xs" radius="xl" color="blue" fullWidth
            value={state.intensity}
            onChange={(val) => { setState({ ...state, intensity: val }); setActiveIndex(0); }}
            data={[{ label: 'Optimal', value: 'optimal' }, { label: 'Minimal', value: 'minimal' }]}
            fw={600}
          />
        </Center>

        <div 
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ 
            position: 'relative', width: '100%', height: '35vh', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', perspective: '1000px',
            overflow: 'hidden', touchAction: 'pan-y'
          }}
        >
          {recommendedProducts.map((product, idx) => {
            const offset = idx - activeIndex;
            const absOffset = Math.abs(offset);
            const translateX = offset * 60;
            const scale = Math.max(0, 1 - (absOffset * 0.25));
            const opacity = Math.max(0, 1 - (absOffset * 0.5));
            const zIndex = 10 - absOffset;
            const clickable = absOffset === 1;

            return (
              <div
                key={idx}
                onClick={() => { if (clickable) setActiveIndex(idx); }}
                style={{
                  position: 'absolute', transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                  transform: `translateX(${translateX}%) scale(${scale})`, opacity, zIndex,
                  cursor: clickable ? 'pointer' : 'default', width: '80%', maxWidth: '280px', userSelect: 'none'
                }}
              >
                <ProductImageBox product={product} isDark={isDark} />
              </div>
            );
          })}
        </div>

        <Stack align="center" ta="center" mt="md" gap="xs">
          <Badge size="sm" color="blue" variant="light">Product {activeIndex + 1} of {recommendedProducts.length}</Badge>
          <Title order={2} size="1.6rem" style={{ lineHeight: 1.1 }}>{activeProduct?.productName}</Title>
          <Text size="sm" c="dimmed" lineClamp={3}>{activeProduct?.overview}</Text>
          
          <Paper withBorder p="sm" radius="md" bg={isDark ? 'dark.7' : 'blue.0'} w="100%" mt="sm" style={{ borderColor: isDark ? undefined : 'var(--mantine-color-blue-2)' }}>
             <Text size="xs" fw={800} c="blue" tt="uppercase" mb={2} style={{ letterSpacing: '0.5px' }}>Recommended Dosage</Text>
             <Text size="sm" fw={600} c={isDark ? 'white' : 'dark.9'}>{activeProduct?.dose}</Text>
          </Paper>
        </Stack>
      </Stack>
    );
  }

  return (
     <Stack style={fadeStyles} h="100%" justify="space-between" pb="xl">
        <div>
          <Group justify="space-between" mb="md">
            <Button variant="subtle" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={16} />}>Back</Button>
            <Button variant="light" color="blue" onClick={onComplete} rightSection={<IconArrowRight size={16} />}>View Final Summary</Button>
          </Group>
          <Title order={2} ta="center" size="2rem">{condition.name}</Title>
          <Text ta="center" c="dimmed" maw={700} mx="auto" mt="sm" mb="md">{condition.rationale}</Text>
          
          <Center mb="lg">
            <SegmentedControl
              size="sm" radius="xl" color="blue"
              value={state.intensity}
              onChange={(val) => { setState({ ...state, intensity: val }); setActiveIndex(0); }}
              data={[{ label: 'Optimal Support', value: 'optimal' }, { label: 'Minimal / Foundational', value: 'minimal' }]}
              fw={600}
            />
          </Center>
        </div>

        <Grid mt="sm" align="center" style={{ flexGrow: 1 }}>
          <Grid.Col span={6} style={{ display: 'flex', justifyContent: 'center' }}>
            <div 
              style={{ 
                position: 'relative', width: '100%', height: '45vh', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', perspective: '1000px',
                overflow: 'hidden'
              }}
            >
              {recommendedProducts.map((product, idx) => {
                const offset = idx - activeIndex;
                const absOffset = Math.abs(offset);
                const translateX = offset * 55;
                const scale = Math.max(0, 1 - (absOffset * 0.25));
                const opacity = Math.max(0, 1 - (absOffset * 0.5));
                const zIndex = 10 - absOffset;
                const clickable = absOffset === 1;

                return (
                  <div
                    key={idx}
                    onClick={() => { if (clickable) setActiveIndex(idx); }}
                    style={{
                      position: 'absolute', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                      transform: `translateX(${translateX}%) scale(${scale})`, opacity, zIndex,
                      cursor: clickable ? 'pointer' : 'default', width: '100%', maxWidth: '320px', userSelect: 'none'
                    }}
                  >
                    <ProductImageBox product={product} isDark={isDark} />
                  </div>
                );
              })}
            </div>
          </Grid.Col>
          
          <Grid.Col span={6}>
             <Stack justify="center" h="100%" px="xl">
                <Badge size="lg" color="blue" variant="light" mb="xs">
                  Product {activeIndex + 1} of {recommendedProducts.length}
                </Badge>
                <Title order={1} size="2.5rem" style={{ lineHeight: 1.1 }}>{activeProduct?.productName}</Title>
                <Text size="lg" c="dimmed" mb="md" style={{ lineHeight: 1.6 }}>{activeProduct?.overview}</Text>
                
                <Paper withBorder p="lg" radius="md" bg={isDark ? 'dark.7' : 'blue.0'} style={{ borderColor: isDark ? undefined : 'var(--mantine-color-blue-2)' }}>
                   <Text size="sm" fw={800} c="blue" tt="uppercase" mb={4} style={{ letterSpacing: '0.5px' }}>Recommended Dosage</Text>
                   <Text size="md" fw={600} c={isDark ? 'white' : 'dark.9'}>{activeProduct?.dose}</Text>
                </Paper>

                <Group mt="xl">
                   <Button size="md" variant="default" disabled={activeIndex === 0} onClick={() => setActiveIndex(i => i - 1)}>Previous</Button>
                   <Button size="md" variant="default" disabled={activeIndex === recommendedProducts.length - 1} onClick={() => setActiveIndex(i => i + 1)}>Next Product</Button>
                </Group>
             </Stack>
          </Grid.Col>
        </Grid>
     </Stack>
  );
}

function FinalSummaryScreen({ state, setState, guidanceData, productCatalog, onBack }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const summaryRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const condition = guidanceData.conditions.find(c => c.id === state.primaryFocus);

  const recommendedProducts = useMemo(() => {
    if (!condition) return [];
    return (condition[state.intensity] || []).map(rec => {
      const safeName = (rec.productName || rec.name || '').toLowerCase();
      const rich = productCatalog.find(p => (p.name || '').toLowerCase() === safeName) || {};
      return {
        ...rec,
        productName: rec.productName || rec.name || 'Unknown Product',
        category: rich.category || "Supplement",
        image: rich.image ? resolvePath(`images/${rich.image}`) : resolvePath('favicon.svg'),
        dose: rec.dose
      };
    });
  }, [condition, state.intensity, productCatalog]);

  const handleExportCSV = () => {
    const exportData = recommendedProducts.map(p => ({
      GeneratedDate: new Date().toISOString().split('T')[0],
      PrimaryFocus: condition.name,
      Product: p.productName,
      RecommendedDosage: p.dose
    }));
    exportToCSV(exportData, `usana_guidance_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImageCapture = async (action) => {
    if (!summaryRef.current) return;
    try {
      setIsGenerating(true);
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(summaryRef.current, { scale: 2, useCORS: true, backgroundColor: isDark ? '#25262b' : '#ffffff' });
      if (action === 'copy') {
        canvas.toBlob(async (blob) => {
          try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); alert('Image copied to clipboard!'); } 
          catch (err) { alert('Your browser does not support direct clipboard images. Saving the file instead.'); saveCanvas(canvas); }
        });
      } else { saveCanvas(canvas); }
    } catch (err) {
      console.error("Image generation failed:", err); alert('Failed to generate image.');
    } finally { setIsGenerating(false); }
  };

  const saveCanvas = (canvas) => {
    const link = document.createElement('a');
    link.download = `USANA_Guidance_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Stack style={fadeStyles} align="center" w="100%" gap={isMobile ? "md" : "xl"} mt={isMobile ? 0 : 20} pb="xl">
      {/* Viewport Aware Header Actions */}
      {isMobile ? (
        <Stack w="100%" gap="xs" className="no-print">
          <Button variant="subtle" color="gray" size="sm" onClick={onBack} leftSection={<IconArrowLeft size={14} />}>Back to Products</Button>
          <ScrollArea w="100%" type="never">
            <Group wrap="nowrap" pb="xs" gap="xs">
              <Button size="xs" variant="default" leftSection={<IconDownload size={14} />} onClick={handleExportCSV}>Export</Button>
              <Button size="xs" variant="default" leftSection={<IconCopy size={14} />} onClick={() => handleImageCapture('copy')} loading={isGenerating}>Copy</Button>
              <Button size="xs" variant="default" leftSection={<IconPhoto size={14} />} onClick={() => handleImageCapture('save')} loading={isGenerating}>Save</Button>
              <Button size="xs" variant="default" leftSection={<IconPrinter size={14} />} onClick={() => window.print()}>Print</Button>
            </Group>
          </ScrollArea>
        </Stack>
      ) : (
        <Group w="100%" justify="space-between" className="no-print">
          <Button variant="subtle" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={16} />}>Back to Products</Button>
          <Group>
            <Button variant="default" leftSection={<IconDownload size={16} />} onClick={handleExportCSV}>Export CSV</Button>
            <Button variant="default" leftSection={<IconCopy size={16} />} onClick={() => handleImageCapture('copy')} loading={isGenerating}>Copy Image</Button>
            <Button variant="default" leftSection={<IconPhoto size={16} />} onClick={() => handleImageCapture('save')} loading={isGenerating}>Save Image</Button>
            <Button variant="default" leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>Print PDF</Button>
          </Group>
        </Group>
      )}

      <Paper 
        ref={summaryRef}
        className="summary-card"
        withBorder 
        p={isMobile ? 20 : 40} 
        radius="lg" 
        w="100%" 
        maw={800} 
        bg={isDark ? 'dark.7' : 'white'}
        shadow="md"
      >
        <Title order={1} ta="center" size={isMobile ? "1.75rem" : "h1"} mb="sm">Your Product Guidance Summary</Title>
        <Text ta="center" c="dimmed" size={isMobile ? "xs" : "sm"} mb="xl">Generated on {new Date().toLocaleDateString()}</Text>

        <Grid mb="xl">
          <Grid.Col span={12}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" ta="center">Wellness Focus</Text>
            <Text size={isMobile ? "md" : "lg"} fw={500} ta="center">{condition?.name || 'N/A'}</Text>
          </Grid.Col>
        </Grid>

        <Divider my={isMobile ? "md" : "xl"} />

        {isMobile ? (
          <Stack align="center" mb="md" gap="sm">
            <Title order={3} c="blue" size="h4">Recommended Products</Title>
            <SegmentedControl
              size="xs" radius="xl" color="blue" fullWidth
              value={state.intensity}
              onChange={(val) => setState({ ...state, intensity: val })}
              data={[{ label: 'Optimal Support', value: 'optimal' }, { label: 'Minimal / Foundational', value: 'minimal' }]}
              className="no-print" fw={600}
            />
          </Stack>
        ) : (
          <Group justify="space-between" align="center" mb="md">
            <Title order={3} c="blue">Recommended Products</Title>
            <SegmentedControl
              size="sm" radius="xl" color="blue"
              value={state.intensity}
              onChange={(val) => setState({ ...state, intensity: val })}
              data={[{ label: 'Optimal Support', value: 'optimal' }, { label: 'Minimal / Foundational', value: 'minimal' }]}
              className="no-print" fw={600}
            />
          </Group>
        )}

        <Stack gap={isMobile ? "xs" : "md"} mb="xl">
          {recommendedProducts.map((p, idx) => (
            <Card key={idx} withBorder radius="md" bg={isDark ? 'dark.6' : 'gray.0'} className="summary-card" p={isMobile ? "md" : "lg"}>
              
              {/* TRUE VIEWPORT BRANCHING FOR SUMMARY CARDS */}
              {isMobile ? (
                <Stack gap="xs">
                  <Group wrap="nowrap" align="center">
                    <div style={{ width: 64, height: 64, backgroundColor: isDark ? 'var(--mantine-color-dark-5)' : 'white', borderRadius: 8, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                      <img src={p.image} alt={p.productName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text fw={700} size="md" lineClamp={1}>{p.productName}</Text>
                      <Text size="xs" c="dimmed" style={{ textTransform: 'capitalize' }}>{p.category}</Text>
                    </div>
                  </Group>
                  <Paper withBorder p="xs" radius="sm" bg={isDark ? 'dark.7' : 'blue.0'} style={{ borderColor: isDark ? undefined : 'var(--mantine-color-blue-2)' }}>
                    <Text size="xs" fw={800} c="blue" tt="uppercase" mb={2}>Recommended Dosage</Text>
                    <Text size="sm" fw={600} c={isDark ? 'white' : 'dark.9'}>{p.dose}</Text>
                  </Paper>
                </Stack>
              ) : (
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <div style={{ width: 80, height: 80, backgroundColor: isDark ? 'var(--mantine-color-dark-5)' : 'white', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                      <img src={p.image} alt={p.productName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <Text fw={700} size="lg">{p.productName}</Text>
                      <Text size="sm" c="dimmed" style={{ textTransform: 'capitalize' }}>{p.category}</Text>
                    </div>
                  </Group>
                  <div style={{ textAlign: 'right', maxWidth: '50%' }}>
                    <Text size="xs" fw={700} c="blue" tt="uppercase" mb={2}>Recommended Dosage</Text>
                    <Text size="sm" fw={500}>{p.dose}</Text>
                  </div>
                </Group>
              )}
              
            </Card>
          ))}
        </Stack>

        {condition?.lifestyle && (
          <>
            <Divider my={isMobile ? "md" : "xl"} />
            <Title order={3} mb="md" c="green.6" size={isMobile ? "h4" : "h3"} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconSalad size={isMobile ? 20 : 24} /> Supporting Lifestyle Habits
            </Title>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" bg={isDark ? 'dark.6' : 'gray.0'} className="summary-card" h="100%">
                  <Group mb="md">
                    <ThemeIcon color="green" variant="light" size={isMobile ? "md" : "lg"} radius="md">
                      <IconSalad size={isMobile ? 16 : 20} />
                    </ThemeIcon>
                    <Text fw={700} size={isMobile ? "md" : "lg"}>Dietary Focus</Text>
                  </Group>
                  <Stack gap="sm">
                    {condition.lifestyle.nutrition.map((item, i) => (
                      <Group wrap="nowrap" align="flex-start" key={i}>
                        <Text c="green.5" fw={900} size="md" style={{ lineHeight: 1 }}>•</Text>
                        <Text size={isMobile ? "xs" : "sm"} c={isDark ? 'gray.3' : 'gray.8'} style={{ lineHeight: 1.5 }}>{item}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" bg={isDark ? 'dark.6' : 'gray.0'} className="summary-card" h="100%">
                  <Group mb="md">
                    <ThemeIcon color="orange" variant="light" size={isMobile ? "md" : "lg"} radius="md">
                      <IconBarbell size={isMobile ? 16 : 20} />
                    </ThemeIcon>
                    <Text fw={700} size={isMobile ? "md" : "lg"}>Movement & Exercise</Text>
                  </Group>
                  <Stack gap="sm">
                    {condition.lifestyle.workout.map((item, i) => (
                      <Group wrap="nowrap" align="flex-start" key={i}>
                        <Text c="orange.5" fw={900} size="md" style={{ lineHeight: 1 }}>•</Text>
                        <Text size={isMobile ? "xs" : "sm"} c={isDark ? 'gray.3' : 'gray.8'} style={{ lineHeight: 1.5 }}>{item}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </>
        )}

        <Alert icon={<IconStethoscope size={20} />} title="Not Medical Advice" color="gray" variant="light" radius="md" mt={isMobile ? 20 : 40} style={{ fontSize: isMobile ? '0.75rem' : 'inherit' }}>
          {guidanceData?._meta?.disclaimer}
        </Alert>
      </Paper>
    </Stack>
  );
}

// ============================================================================
// MAIN APPLICATION SHELL
// ============================================================================
function ProductGuidance() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [guidanceData, setGuidanceData] = useState(null);
  const [productCatalog, setProductCatalog] = useState([]);

  const [currentStep, setCurrentStep] = useState(0);
  const [wizardState, setWizardState] = useState({
    primaryFocus: '',
    intensity: 'optimal'
  });

  useEffect(() => {
    async function fetchRelationalData() {
      try {
        const [rulesRes, catalogRes] = await Promise.all([
          fetch(resolvePath('data/guidance-rules.json')),
          fetch(resolvePath('data/products.json')).catch(() => ({ ok: false }))
        ]);

        if (!rulesRes.ok) throw new Error("Could not load guidance rules.");
        const rules = await rulesRes.json();
        setGuidanceData(rules);
        
        if (catalogRes.ok) {
          const catalog = await catalogRes.json();
          setProductCatalog(catalog);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRelationalData();
  }, []);

  const handleImportCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const expectedHeaders = ['GeneratedDate', 'PrimaryFocus', 'Product', 'RecommendedDosage'];
      const data = await parseCSV(file, expectedHeaders);
      if (!data || data.length === 0) throw new Error("CSV file is empty or invalid.");

      const firstRow = data[0];
      const condition = guidanceData.conditions.find(c => c.name === firstRow.PrimaryFocus);

      if (!condition) throw new Error(`Unrecognized Health Focus: ${firstRow.PrimaryFocus}`);

      setWizardState({
        primaryFocus: condition.id,
        intensity: 'optimal'
      });
      
      setCurrentStep(3); 
    } catch (err) {
      console.error(err);
      alert(`Import failed: ${err.message}`);
    } finally {
      event.target.value = null; 
    }
  };

  const handleFocusSelect = useCallback((focusId) => {
    try {
      setWizardState(prev => ({ ...prev, primaryFocus: focusId }));
      setTimeout(() => setCurrentStep(2), 350); 
    } catch (err) {
      console.error("Routing Error:", err);
    }
  }, []);

  const handleBackFromProducts = useCallback(() => {
    setCurrentStep(1); 
  }, []);

  if (isLoading) {
    return (
      <Center h="100vh" bg={isDark ? 'dark.8' : 'gray.0'}>
        <Stack align="center"><Loader color="blue" type="bars" /></Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh" bg={isDark ? 'dark.8' : 'gray.0'}>
        <Alert icon={<IconAlertCircle size={20} />} title="System Error" color="red">{error}</Alert>
      </Center>
    );
  }

  return (
    <AppShell header={{ height: 60 }} bg={isDark ? 'dark.8' : 'gray.0'}>
      <style>{`
        html, body { height: 100%; background-color: ${isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)'} !important; }
        #app-mount { height: 100%; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <style>{printStyles}</style>

      {/* Clean, isolated Top Header */}
      <AppShell.Header withBorder={true} className="no-print" style={{ backgroundColor: isDark ? 'var(--mantine-color-dark-8)' : 'white' }}>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Group gap="sm" component="a" href={resolvePath('')} style={{ textDecoration: 'none' }}>
              <Avatar src={resolvePath('favicon.svg')} size={28} radius="sm" style={{ background: 'transparent' }} />
              <Title order={4} c={isDark ? 'white' : 'dark.9'} style={{ letterSpacing: '1px', textTransform: 'uppercase' }}>
                Product Guidance
              </Title>
            </Group>
            <ThemeToggle />
          </Group>
        </Container>
      </AppShell.Header>
      
      {/* 90px bottom padding protects the floating GuidanceNavBar from eating content */}
      <AppShell.Main className="print-auto-height" style={{ minHeight: '100vh', paddingBottom: '90px' }}>
        <Container size="xl" h="100%" pt={40} px={{ base: 'xs', md: 'md' }} className="print-auto-height" style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div className="print-auto-height" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {currentStep === 0 && <WelcomeScreen onNext={() => setCurrentStep(1)} onImport={handleImportCSV} />}
            {currentStep === 1 && <FocusQuestion state={wizardState} onSelect={handleFocusSelect} guidanceData={guidanceData} onBack={() => setCurrentStep(0)} />}
            {currentStep === 2 && <ProductDiscoveryScreen state={wizardState} setState={setWizardState} guidanceData={guidanceData} productCatalog={productCatalog} onBack={handleBackFromProducts} onComplete={() => setCurrentStep(3)} />}
            {currentStep === 3 && <FinalSummaryScreen state={wizardState} setState={setWizardState} guidanceData={guidanceData} productCatalog={productCatalog} onBack={() => setCurrentStep(2)} />}
          </div>

        </Container>
      </AppShell.Main>
      
      {/* Floating Bottom Nav injected entirely outside of AppShell's core structural layout */}
      <div className="no-print">
        <GuidanceNavBar />
      </div>
    </AppShell>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (<MantineProvider><Center h="100vh"><Text c="red">Crash: {this.state.error.toString()}</Text></Center></MantineProvider>);
    return this.props.children;
  }
}

const container = document.getElementById('app-mount');
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <MantineProvider defaultColorScheme="auto">
      <ProductGuidance />
    </MantineProvider>
  </ErrorBoundary>
);