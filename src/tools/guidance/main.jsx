import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, AppShell, Group, Title, Text, Button, 
  Container, Paper, Stack, Avatar, Progress, Loader, Center, Alert,
  Grid, Badge, ScrollArea, TextInput, Card, Divider, ThemeIcon,
  useMantineColorScheme, useComputedColorScheme
} from '@mantine/core';
import { 
  IconSun, IconMoon, IconAlertCircle, IconArrowRight, IconArrowLeft,
  IconSearch, IconStethoscope, IconDownload, IconPrinter,
  IconSalad, IconBarbell, IconUpload, IconCopy, IconPhoto
} from '@tabler/icons-react';

import '@mantine/core/styles.css';
import { resolvePath } from '../../shared/base-path.js';
import { exportToCSV, parseCSV } from '../../shared/import-export/csv.js';

// Shared Transition & Print Styles
const fadeStyles = {
  animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
};

const printStyles = `
  @media print {
    /* Critical fix for blank first page caused by vh/percentage heights */
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
    
    /* Force text colors to be legible in print regardless of active dark mode */
    * { color: black !important; }
    
    /* Preserve image visibility */
    img { display: block !important; max-width: 100% !important; }
  }
`;

function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';
  return (
    <Button variant="default" size="sm" onClick={() => toggleColorScheme()} px="xs" className="no-print">
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </Button>
  );
}

// Question Components

function WelcomeScreen({ onNext, onImport }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const fileInputRef = useRef(null);

  return (
    <Stack style={fadeStyles} align="center" justify="center" h="100%" gap="xl">
      <Avatar src={resolvePath('favicon.svg')} size={80} radius="md" style={{ background: 'transparent' }} mb="md" />
      <Title order={1} ta="center" size="3rem" c={isDark ? 'white' : 'dark.9'} style={{ letterSpacing: '-1px' }}>
        Discover Your Optimal Wellness.
      </Title>
      <Text size="xl" c="dimmed" ta="center" maw={600} mb="xl" style={{ lineHeight: 1.6 }}>
        Answer a few simple questions to receive personalized, science-based nutritional product guidance tailored to your body's unique demands.
      </Text>
      
      <Stack align="center" gap="sm">
        <Button 
          size="xl" 
          radius="xl" 
          color="blue" 
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
          leftSection={<IconUpload size={18} />}
          onClick={() => fileInputRef.current?.click()}
          mt="sm"
        >
          Restore Previous Guidance (CSV)
        </Button>
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={onImport} 
        />
      </Stack>
    </Stack>
  );
}

function AgeQuestion({ state, onSelect, onBack }) {
  const options = [
    { label: 'Child (2-12)', value: '2-12' },
    { label: 'Teenager (13-19)', value: '13-19' },
    { label: 'Adult (20-59)', value: '20-59' },
    { label: 'Senior (60+)', value: '60+' }
  ];
  const isDark = useComputedColorScheme('light') === 'dark';

  return (
    <Stack style={fadeStyles} align="center" w="100%" gap="xl" mt={40}>
      <Group w="100%" justify="flex-start" mb="xl">
        <Button variant="subtle" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={16} />}>
          Back
        </Button>
      </Group>
      <Title order={2} ta="center" size="2.5rem" mb="xl" c={isDark ? 'white' : 'dark.9'}>
        What is your age group?
      </Title>
      <Grid w="100%" maw={700} gutter="md">
        {options.map((opt) => {
          const isSelected = state.ageGroup === opt.value;
          return (
            <Grid.Col span={{ base: 12, sm: 6 }} key={opt.value}>
              <Paper
                withBorder
                p="xl"
                radius="md"
                bg={isSelected ? 'blue.6' : (isDark ? 'dark.7' : 'white')}
                c={isSelected ? 'white' : (isDark ? 'gray.3' : 'dark.9')}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  borderColor: isSelected ? 'transparent' : undefined
                }}
                onClick={() => onSelect(opt.value)}
              >
                <Text ta="center" size="lg" fw={600}>{opt.label}</Text>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );
}

function SexQuestion({ state, onSelect, onBack }) {
  const options = ['Male', 'Female'];
  const isDark = useComputedColorScheme('light') === 'dark';

  return (
    <Stack style={fadeStyles} align="center" w="100%" gap="xl" mt={40}>
      <Group w="100%" justify="flex-start" mb="xl">
        <Button variant="subtle" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={16} />}>
          Back
        </Button>
      </Group>
      <Title order={2} ta="center" size="2.5rem" mb="xl" c={isDark ? 'white' : 'dark.9'}>
        Which best describes you?
      </Title>
      <Grid w="100%" maw={500} gutter="md">
        {options.map((sex) => {
          const isSelected = state.sex === sex;
          return (
            <Grid.Col span={12} key={sex}>
              <Paper
                withBorder
                p="xl"
                radius="md"
                bg={isSelected ? 'blue.6' : (isDark ? 'dark.7' : 'white')}
                c={isSelected ? 'white' : (isDark ? 'gray.3' : 'dark.9')}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease', transform: isSelected ? 'scale(1.02)' : 'scale(1)' }}
                onClick={() => onSelect(sex)}
              >
                <Text ta="center" size="xl" fw={600}>{sex}</Text>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );
}

function FocusQuestion({ state, onSelect, guidanceData, onBack }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const [search, setSearch] = useState('');

  const conditions = guidanceData?.conditions || [];
  const filtered = conditions.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    !['pediatric_health', 'teen_health'].includes(c.id)
  );

  return (
    <Stack style={fadeStyles} align="center" w="100%" gap="xl" mt={20}>
      <Group w="100%" justify="flex-start">
        <Button variant="subtle" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={16} />}>
          Back
        </Button>
      </Group>
      <Title order={2} ta="center" size="2.5rem" c={isDark ? 'white' : 'dark.9'}>
        What would you like to focus on?
      </Title>
      
      <TextInput
        placeholder="Search wellness goals (e.g., Energy, Immune, Bones)..."
        size="lg"
        w="100%"
        maw={600}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<IconSearch size={20} />}
        radius="md"
      />

      <ScrollArea h={400} w="100%" maw={600} type="scroll" offsetScrollbars>
        <Stack gap="sm" pb="xl">
          {filtered.map(c => {
            const isSelected = state.primaryFocus === c.id;
            return (
              <Paper
                key={c.id}
                withBorder
                p="lg"
                radius="md"
                bg={isSelected ? 'blue.6' : (isDark ? 'dark.7' : 'white')}
                c={isSelected ? 'white' : (isDark ? 'gray.3' : 'dark.9')}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => onSelect(c.id)}
                onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'; }}
                onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = isDark ? 'var(--mantine-color-dark-7)' : 'white'; }}
              >
                <Text size="lg" fw={600}>{c.name}</Text>
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

function ProductDiscoveryScreen({ state, guidanceData, productCatalog, onBack, onComplete }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const condition = guidanceData.conditions.find(c => c.id === state.primaryFocus);
  const [activeIndex, setActiveIndex] = useState(0);

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
  const prevProduct = activeIndex > 0 ? recommendedProducts[activeIndex - 1] : null;
  const nextProduct = activeIndex < recommendedProducts.length - 1 ? recommendedProducts[activeIndex + 1] : null;

  return (
     <Stack style={fadeStyles} h="100%" justify="space-between" pb="xl">
        <div>
          <Group justify="space-between" mb="md">
            <Button variant="subtle" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={16} />}>Back</Button>
            <Button variant="light" color="blue" onClick={onComplete} rightSection={<IconArrowRight size={16} />}>View Final Summary</Button>
          </Group>
          <Title order={2} ta="center" size="2rem">{condition.name}</Title>
          <Text ta="center" c="dimmed" maw={700} mx="auto" mt="sm">{condition.rationale}</Text>
        </div>

        <Grid mt="xl" align="center" style={{ flexGrow: 1 }}>
          <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', height: '45vh', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1000px' }}>
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
                    onClick={() => {
                      if (clickable) setActiveIndex(idx);
                    }}
                    style={{
                      position: 'absolute',
                      transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                      transform: `translateX(${translateX}%) scale(${scale})`,
                      opacity,
                      zIndex,
                      cursor: clickable ? 'pointer' : 'default',
                      width: '100%',
                      maxWidth: '320px'
                    }}
                  >
                    <ProductImageBox product={product} isDark={isDark} />
                  </div>
                );
              })}
            </div>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
             <Stack justify="center" h="100%" px={{ base: 0, md: 'xl' }}>
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

function FinalSummaryScreen({ state, guidanceData, productCatalog, onBack }) {
  const isDark = useComputedColorScheme('light') === 'dark';
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
        image: rich.image ? resolvePath(`images/${rich.image}`) : resolvePath('favicon.svg')
      };
    });
  }, [condition, state.intensity, productCatalog]);

  const handleExportCSV = () => {
    const exportData = recommendedProducts.map(p => ({
      GeneratedDate: new Date().toISOString().split('T')[0],
      AgeGroup: state.ageGroup,
      Profile: state.sex || 'N/A',
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
      // Dynamically load html2canvas to avoid breaking the bundle if not installed yet
      const { default: html2canvas } = await import('html2canvas');
      
      const canvas = await html2canvas(summaryRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: isDark ? '#25262b' : '#ffffff' 
      });
      
      if (action === 'copy') {
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            alert('Image copied to clipboard! You can now paste it into a message or document.');
          } catch (err) {
            alert('Your browser does not support direct clipboard images. Saving the file instead.');
            saveCanvas(canvas);
          }
        });
      } else {
        saveCanvas(canvas);
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      alert('Failed to generate image. Ensure html2canvas is installed via npm.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCanvas = (canvas) => {
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `USANA_Guidance_${new Date().toISOString().split('T')[0]}.png`;
    link.href = url;
    link.click();
  };

  return (
    <Stack style={fadeStyles} align="center" w="100%" gap="xl" mt={20} pb="xl">
      <Group w="100%" justify="space-between" className="no-print">
        <Button variant="subtle" color="gray" onClick={onBack} leftSection={<IconArrowLeft size={16} />}>
          Back to Products
        </Button>
        <Group>
          <Button variant="default" leftSection={<IconDownload size={16} />} onClick={handleExportCSV}>Export CSV</Button>
          <Button variant="default" leftSection={<IconCopy size={16} />} onClick={() => handleImageCapture('copy')} loading={isGenerating}>Copy Image</Button>
          <Button variant="default" leftSection={<IconPhoto size={16} />} onClick={() => handleImageCapture('save')} loading={isGenerating}>Save Image</Button>
          <Button variant="default" leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>Print PDF</Button>
        </Group>
      </Group>

      <Paper 
        ref={summaryRef}
        className="summary-card"
        withBorder 
        p={40} 
        radius="lg" 
        w="100%" 
        maw={800} 
        bg={isDark ? 'dark.7' : 'white'}
        shadow="md"
      >
        <Title order={1} ta="center" mb="sm">Your Product Guidance Summary</Title>
        <Text ta="center" c="dimmed" mb="xl">Generated on {new Date().toLocaleDateString()}</Text>

        <Grid mb="xl">
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed" fw={600} tt="uppercase">Profile</Text>
            <Text size="lg" fw={500}>{state.ageGroup} {state.sex ? `• ${state.sex}` : ''}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed" fw={600} tt="uppercase">Wellness Focus</Text>
            <Text size="lg" fw={500}>{condition?.name || 'N/A'}</Text>
          </Grid.Col>
        </Grid>

        <Divider my="xl" />

        <Title order={3} mb="md" c="blue">Recommended Products</Title>
        <Stack gap="md" mb="xl">
          {recommendedProducts.map((p, idx) => (
            <Card key={idx} withBorder radius="md" bg={isDark ? 'dark.6' : 'gray.0'} className="summary-card">
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
            </Card>
          ))}
        </Stack>

        {condition?.lifestyle && (
          <>
            <Divider my="xl" />
            <Title order={3} mb="md" c="green.6" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconSalad size={24} /> Supporting Lifestyle Habits
            </Title>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" bg={isDark ? 'dark.6' : 'gray.0'} className="summary-card" h="100%">
                  <Group mb="md">
                    <ThemeIcon color="green" variant="light" size="lg" radius="md">
                      <IconSalad size={20} />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Dietary Focus</Text>
                  </Group>
                  <Stack gap="sm">
                    {condition.lifestyle.nutrition.map((item, i) => (
                      <Group wrap="nowrap" align="flex-start" key={i}>
                        <Text c="green.5" fw={900} size="md" style={{ lineHeight: 1 }}>•</Text>
                        <Text size="sm" c={isDark ? 'gray.3' : 'gray.8'} style={{ lineHeight: 1.5 }}>{item}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" bg={isDark ? 'dark.6' : 'gray.0'} className="summary-card" h="100%">
                  <Group mb="md">
                    <ThemeIcon color="orange" variant="light" size="lg" radius="md">
                      <IconBarbell size={20} />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Movement & Exercise</Text>
                  </Group>
                  <Stack gap="sm">
                    {condition.lifestyle.workout.map((item, i) => (
                      <Group wrap="nowrap" align="flex-start" key={i}>
                        <Text c="orange.5" fw={900} size="md" style={{ lineHeight: 1 }}>•</Text>
                        <Text size="sm" c={isDark ? 'gray.3' : 'gray.8'} style={{ lineHeight: 1.5 }}>{item}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </>
        )}

        <Alert icon={<IconStethoscope size={20} />} title="Not Medical Advice" color="gray" variant="light" radius="md" mt={40}>
          {guidanceData?._meta?.disclaimer}
        </Alert>
      </Paper>
    </Stack>
  );
}

// Main Application Shell

function ProductGuidance() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [guidanceData, setGuidanceData] = useState(null);
  const [productCatalog, setProductCatalog] = useState([]);

  const [currentStep, setCurrentStep] = useState(0);
  const [wizardState, setWizardState] = useState({
    ageGroup: '',
    sex: '',
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

  // Robust Routing Handlers
  
  const handleImportCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const expectedHeaders = ['GeneratedDate', 'AgeGroup', 'Profile', 'PrimaryFocus', 'Product', 'RecommendedDosage'];
      const data = await parseCSV(file, expectedHeaders);
      if (!data || data.length === 0) throw new Error("CSV file is empty or invalid.");

      const firstRow = data[0];
      const condition = guidanceData.conditions.find(c => c.name === firstRow.PrimaryFocus);

      if (!condition) throw new Error(`Unrecognized Health Focus: ${firstRow.PrimaryFocus}`);

      setWizardState({
        ageGroup: firstRow.AgeGroup || '',
        sex: firstRow.Profile === 'N/A' ? '' : (firstRow.Profile || ''),
        primaryFocus: condition.id,
        intensity: 'optimal'
      });
      
      setCurrentStep(5);
    } catch (err) {
      console.error(err);
      alert(`Import failed: ${err.message}`);
    } finally {
      event.target.value = null; 
    }
  };

  const handleAgeSelect = useCallback((ageValue) => {
    try {
      setWizardState(prev => ({ ...prev, ageGroup: ageValue, sex: '' }));
      
      setTimeout(() => {
        if (ageValue === '2-12') {
          setWizardState(prev => ({ ...prev, primaryFocus: 'pediatric_health' }));
          setCurrentStep(4); 
        } else if (ageValue === '13-19') {
          setWizardState(prev => ({ ...prev, primaryFocus: 'teen_health' }));
          setCurrentStep(4); 
        } else {
          setCurrentStep(2); 
        }
      }, 350);
    } catch (err) {
      console.error("Routing Error:", err);
      setError("An error occurred during navigation. Please refresh.");
    }
  }, []);

  const handleSexSelect = useCallback((sexValue) => {
    try {
      setWizardState(prev => ({ ...prev, sex: sexValue }));
      setTimeout(() => setCurrentStep(3), 350);
    } catch (err) {
      console.error("Routing Error:", err);
    }
  }, []);

  const handleFocusSelect = useCallback((focusId) => {
    try {
      setWizardState(prev => ({ ...prev, primaryFocus: focusId }));
      setTimeout(() => setCurrentStep(4), 350);
    } catch (err) {
      console.error("Routing Error:", err);
    }
  }, []);

  const handleBackFromProducts = useCallback(() => {
    if (['2-12', '13-19'].includes(wizardState.ageGroup)) {
      setCurrentStep(1);
    } else {
      setCurrentStep(3);
    }
  }, [wizardState.ageGroup]);


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
    <AppShell header={{ height: 64 }} bg={isDark ? 'dark.8' : 'gray.0'}>
      <style>{`
        html, body { height: 100%; background-color: ${isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)'} !important; }
        #app-mount { height: 100%; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <style>{printStyles}</style>
      
      <AppShell.Header withBorder={true} className="no-print">
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Group gap="xl" h="100%">
              <Group gap="sm" component="a" href={resolvePath('')} style={{ textDecoration: 'none' }}>
                <Avatar src={resolvePath('favicon.svg')} size={26} radius="sm" style={{ background: 'transparent' }} />
                <Title order={4} c={isDark ? 'white' : 'dark.9'} style={{ letterSpacing: '-0.5px', marginTop: 2 }}>
                  USANA Empire
                </Title>
              </Group>
              <Group component="nav" gap="sm" visibleFrom="sm" h="100%">
                <Button component="a" href={resolvePath('app/tools/')} variant="light" color="blue" radius="md">Exit Guidance</Button>
              </Group>
            </Group>
            <ThemeToggle />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main className="print-auto-height" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Container size="xl" h="100%" pt={40} pb="xl" className="print-auto-height" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {currentStep > 0 && currentStep < 4 && (
            <div className="no-print">
              <Text size="sm" fw={600} c="dimmed" mb="xs" ta="center">
                Step {currentStep} of 3
              </Text>
              <Progress 
                value={(currentStep / 3) * 100} 
                size="sm" 
                radius="xl" 
                color="blue" 
                style={{ transition: 'width 0.3s ease', maxWidth: 400, margin: '0 auto' }}
              />
            </div>
          )}

          <div className="print-auto-height" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {currentStep === 0 && <WelcomeScreen onNext={() => setCurrentStep(1)} onImport={handleImportCSV} />}
            {currentStep === 1 && <AgeQuestion state={wizardState} onSelect={handleAgeSelect} onBack={() => setCurrentStep(0)} />}
            {currentStep === 2 && <SexQuestion state={wizardState} onSelect={handleSexSelect} onBack={() => setCurrentStep(1)} />}
            {currentStep === 3 && <FocusQuestion state={wizardState} onSelect={handleFocusSelect} guidanceData={guidanceData} onBack={() => setCurrentStep(2)} />}
            {currentStep === 4 && <ProductDiscoveryScreen state={wizardState} guidanceData={guidanceData} productCatalog={productCatalog} onBack={handleBackFromProducts} onComplete={() => setCurrentStep(5)} />}
            {currentStep === 5 && <FinalSummaryScreen state={wizardState} guidanceData={guidanceData} productCatalog={productCatalog} onBack={() => setCurrentStep(4)} />}
          </div>

        </Container>
      </AppShell.Main>
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