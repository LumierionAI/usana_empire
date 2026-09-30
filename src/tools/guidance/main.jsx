import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, AppShell, Group, Title, Text, Button, 
  Container, Paper, Grid, Card, Badge, Stack, Avatar,
  SegmentedControl, Select, ThemeIcon, Alert, Loader, Center,
  useMantineColorScheme, useComputedColorScheme
} from '@mantine/core';
import { 
  IconSun, IconMoon, IconAlertCircle, IconStethoscope, 
  IconSalad, IconBarbell, IconPill, IconHeartbeat
} from '@tabler/icons-react';

import '@mantine/core/styles.css';
import { resolvePath } from '../../shared/base-path.js';

function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';
  return (
    <Button variant="default" size="sm" onClick={() => toggleColorScheme()} px="xs">
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </Button>
  );
}

function ProductGuidance() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [guidanceData, setGuidanceData] = useState(null);
  const [productCatalog, setProductCatalog] = useState([]);

  const [activeConditionId, setActiveConditionId] = useState('');
  const [intensity, setIntensity] = useState('optimal');

  useEffect(() => {
    async function fetchRelationalData() {
      try {
        const [rulesRes, catalogRes] = await Promise.all([
          fetch(resolvePath('data/guidance-rules.json')),
          fetch(resolvePath('data/products.json')).catch(() => ({ ok: false }))
        ]);

        if (!rulesRes.ok) throw new Error("Could not load clinical guidance rules from data/guidance-rules.json");
        
        const rules = await rulesRes.json();
        setGuidanceData(rules);
        
        if (rules.conditions && rules.conditions.length > 0) {
          setActiveConditionId(rules.conditions[0].id);
        }

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

  const activeCondition = useMemo(() => {
    if (!guidanceData || !guidanceData.conditions) return null;
    return guidanceData.conditions.find(c => c.id === activeConditionId) || null;
  }, [guidanceData, activeConditionId]);

// Relational Mapping: Join the clinical dose with the product's rich catalog data
  const recommendedProducts = useMemo(() => {
    if (!activeCondition) return [];
    const recommendations = activeCondition[intensity] || [];
    
    return recommendations.map(rec => {
      // DEFENSIVE PROGRAMMING: Safely handle if JSON uses 'name' instead of 'productName', and prevent undefined crashes.
      const safeProductName = (rec.productName || rec.name || '').toLowerCase();
      
      // Find matching product in products.json safely
      const richData = productCatalog.find(p => (p.name || '').toLowerCase() === safeProductName) || {};
      
      return {
        ...rec,
        productName: rec.productName || rec.name || 'Unknown Product',
        overview: richData.overview || "Premium USANA Nutritional Support.",
        benefits: richData.benefits || [],
        image: richData.image ? resolvePath(`images/${richData.image}`) : resolvePath('favicon.svg'),
        category: richData.category || "supplement"
      };
    });
  }, [activeCondition, intensity, productCatalog]);

  if (isLoading) {
    return (
      <Center h="100vh" bg={isDark ? 'dark.8' : 'gray.0'}>
        <Stack align="center">
          <Loader color="blue" type="bars" />
          <Text c="dimmed" fw={500}>Loading Clinical Protocols...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh" bg={isDark ? 'dark.8' : 'gray.0'}>
        <Alert icon={<IconAlertCircle size={20} />} title="System Error" color="red" variant="filled" radius="md">
          {error}
        </Alert>
      </Center>
    );
  }

  return (
    <AppShell header={{ height: 64 }} bg={isDark ? 'dark.8' : 'gray.0'}>
      <AppShell.Header withBorder={true}>
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
                <Button component="a" href={resolvePath('app/product/')} variant="subtle" color="gray" radius="md">Product</Button>
                <Button component="a" href={resolvePath('app/business/')} variant="subtle" color="gray" radius="md">Business</Button>
                <Button component="a" href={resolvePath('app/tools/')} variant="light" color="blue" radius="md">Workspace</Button>
              </Group>
            </Group>
            <ThemeToggle />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" py="xl">
          
          {/* Horizontal Command Ribbon */}
          <Paper withBorder shadow={isDark ? "sm" : "md"} radius="lg" p="lg" mb="xl" bg={isDark ? 'dark.7' : 'white'}>
            <Grid align="flex-end" gutter="xl">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={<Text fw={600} mb={6} size="sm" c={isDark ? 'gray.3' : 'gray.7'}>Select Health Focus</Text>}
                  size="md"
                  radius="md"
                  value={activeConditionId}
                  onChange={setActiveConditionId}
                  data={guidanceData.conditions.map(c => ({ value: c.id, label: c.name }))}
                  searchable
                  leftSection={<IconHeartbeat size={18} />}
                  styles={{ input: { fontWeight: 600 } }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text fw={600} mb={6} size="sm" c={isDark ? 'gray.3' : 'gray.7'}>Protocol Intensity</Text>
                <SegmentedControl
                  fullWidth
                  size="md"
                  radius="md"
                  color="blue"
                  value={intensity}
                  onChange={setIntensity}
                  data={[
                    { label: 'Optimal Support', value: 'optimal' },
                    { label: 'Minimal / Foundational', value: 'minimal' }
                  ]}
                  styles={{ label: { fontWeight: 600 } }}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Dynamic Protocol Content */}
          {activeCondition && (
            <div style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              
              <Group mb="sm" align="center">
                <Title order={1} c={isDark ? 'white' : 'dark.9'} style={{ letterSpacing: '-0.5px' }}>
                  {activeCondition.name} Protocol
                </Title>
                <Badge size="lg" color={intensity === 'optimal' ? 'blue' : 'gray'} variant={isDark ? "light" : "filled"}>
                  {intensity.toUpperCase()} TIER
                </Badge>
              </Group>
              
              <Text size="lg" c={isDark ? 'gray.4' : 'gray.6'} mb="xl" style={{ maxWidth: 850, lineHeight: 1.6 }}>
                {activeCondition.rationale}
              </Text>

              {/* Supplements Grid (Cards) */}
              <Title order={3} mb="md" c="blue" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconPill size={24} /> Targeted Supplements
              </Title>
              
              <Grid gutter="xl" mb="xl">
                {recommendedProducts.map((product, idx) => (
                  <Grid.Col key={idx} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card 
                      shadow="sm" 
                      radius="md" 
                      withBorder 
                      bg={isDark ? 'dark.7' : 'white'}
                      h="100%"
                      style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'; }}
                    >
                      <Card.Section 
                        p="lg" 
                        bg={isDark ? 'dark.6' : 'gray.0'}
                        style={{ borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}` }}
                      >
                        <Group wrap="nowrap" align="center">
                          <div style={{ width: 80, height: 80, flexShrink: 0, backgroundColor: 'white', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <img src={product.image} alt={product.productName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                              onError={(e) => { e.target.src = resolvePath('favicon.svg'); e.target.style.opacity = 0.5; }}
                            />
                          </div>
                          <div>
                            <Text fw={800} size="xl" c={isDark ? 'white' : 'dark.9'} style={{ lineHeight: 1.2 }}>{product.productName}</Text>
                          </div>
                        </Group>
                      </Card.Section>

                      <Stack justify="space-between" mt="md" style={{ flexGrow: 1 }}>
                        <Text size="sm" c={isDark ? 'gray.4' : 'gray.7'} style={{ lineHeight: 1.5 }}>
                          {product.overview}
                        </Text>
                        
                        <Paper bg={isDark ? 'dark.6' : 'blue.0'} p="md" radius="md" style={{ border: isDark ? '1px solid var(--mantine-color-dark-4)' : '1px solid var(--mantine-color-blue-2)' }}>
                          <Text size="xs" fw={800} c="blue" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }} mb={6}>Clinical Dose</Text>
                          <Text size="sm" fw={600} c={isDark ? 'white' : 'dark.9'}>{product.dose}</Text>
                        </Paper>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>

              {/* Evidence-Based Lifestyle Interventions */}
              {activeCondition.lifestyle && (
                <>
                  <Title order={3} mb="lg" mt={50} c="green.6" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconSalad size={24} /> Evidence-Based Lifestyle Interventions
                  </Title>
                  
                  <Grid gutter="xl">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card shadow="sm" radius="lg" p="xl" withBorder bg={isDark ? 'dark.7' : 'white'} h="100%">
                        <Group mb="lg">
                          <ThemeIcon color="green" variant="light" size="xl" radius="md">
                            <IconSalad size={24} />
                          </ThemeIcon>
                          <Title order={4} c={isDark ? 'white' : 'dark.9'}>Clinical Nutrition</Title>
                        </Group>
                        <Stack gap="md">
                          {activeCondition.lifestyle.nutrition.map((item, i) => (
                            <Group wrap="nowrap" align="flex-start" key={i}>
                              <Text c="green.5" fw={900} size="lg" style={{ lineHeight: 1 }}>•</Text>
                              <Text size="sm" c={isDark ? 'gray.3' : 'gray.8'} style={{ lineHeight: 1.5 }}>{item}</Text>
                            </Group>
                          ))}
                        </Stack>
                      </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card shadow="sm" radius="lg" p="xl" withBorder bg={isDark ? 'dark.7' : 'white'} h="100%">
                        <Group mb="lg">
                          <ThemeIcon color="orange" variant="light" size="xl" radius="md">
                            <IconBarbell size={24} />
                          </ThemeIcon>
                          <Title order={4} c={isDark ? 'white' : 'dark.9'}>Exercise Physiology</Title>
                        </Group>
                        <Stack gap="md">
                          {activeCondition.lifestyle.workout.map((item, i) => (
                            <Group wrap="nowrap" align="flex-start" key={i}>
                              <Text c="orange.5" fw={900} size="lg" style={{ lineHeight: 1 }}>•</Text>
                              <Text size="sm" c={isDark ? 'gray.3' : 'gray.8'} style={{ lineHeight: 1.5 }}>{item}</Text>
                            </Group>
                          ))}
                        </Stack>
                      </Card>
                    </Grid.Col>
                  </Grid>
                </>
              )}
            </div>
          )}

          {/* Medical Disclaimer Banner (Moved to Bottom) */}
          {guidanceData?._meta?.disclaimer && (
            <Alert 
              icon={<IconStethoscope size={24} stroke={1.5} />} 
              title="Clinical Disclaimer" 
              color="blue" 
              variant="light" 
              mt={60}
              radius="md"
              styles={{ title: { fontWeight: 700, fontSize: '1rem' } }}
            >
              {guidanceData._meta.disclaimer}
            </Alert>
          )}

        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <MantineProvider defaultColorScheme="auto">
          <Container py="xl" size="sm">
            <Paper withBorder p="xl" radius="md" bg="red.0">
              <Group mb="md">
                <ThemeIcon color="red" size="lg" radius="xl"><IconAlertCircle /></ThemeIcon>
                <Title order={3} c="red.9">Critical Render Error</Title>
              </Group>
              <Text c="red.9" mb="xs" fw={500}>The application failed to render. Please ensure your JSON data files are properly formatted.</Text>
              <Paper bg="white" p="sm" radius="sm" withBorder>
                <Text size="xs" ff="monospace" c="red.9">{this.state.error?.toString()}</Text>
              </Paper>
            </Paper>
          </Container>
        </MantineProvider>
      );
    }
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