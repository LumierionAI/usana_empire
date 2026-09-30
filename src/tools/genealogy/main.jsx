import React, { useState, useMemo, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, AppShell, Group, Title, Text, Button, 
  Container, Paper, Grid, Card, ThemeIcon, Badge, TextInput,
  NumberInput, Select, Modal, Checkbox, Stack, Avatar, SimpleGrid,
  useMantineColorScheme, useComputedColorScheme
} from '@mantine/core';
import { 
  IconHierarchy, IconScale, IconTrendingUp, IconUserPlus, 
  IconSun, IconMoon, IconShield, IconSword, IconCrown, IconDiamond 
} from '@tabler/icons-react';

import '@mantine/core/styles.css';

import { resolvePath } from '../../shared/base-path.js';
import { simulateInteractiveTree } from '../../shared/calc-engine/genealogy-calc.js';

// --- Infinite Canvas & Flexbox Fixes ---
const customStyles = `
  body { background-color: var(--mantine-color-body) !important; transition: background-color 0.3s ease; }
  
  @keyframes diamondPulse {
    0% { box-shadow: 0 0 15px rgba(34, 184, 207, 0.3); transform: translateY(0); }
    50% { box-shadow: 0 0 35px rgba(34, 184, 207, 0.7); transform: translateY(-2px); }
    100% { box-shadow: 0 0 15px rgba(34, 184, 207, 0.3); transform: translateY(0); }
  }
  @keyframes starPulse {
    0% { box-shadow: 0 0 20px rgba(132, 94, 247, 0.4); transform: scale(1); }
    50% { box-shadow: 0 0 50px rgba(132, 94, 247, 0.8); transform: scale(1.02); }
    100% { box-shadow: 0 0 20px rgba(132, 94, 247, 0.4); transform: scale(1); }
  }

  /* The Infinite Canvas Background */
  .genealogy-canvas {
    overflow: auto;
    width: 100%;
    height: 65vh;
    min-height: 500px;
    background-color: var(--mantine-color-gray-0);
    background-image: radial-gradient(var(--mantine-color-gray-3) 1.5px, transparent 0);
    background-size: 25px 25px;
    padding: 3rem;
    border-radius: 8px;
  }
  [data-mantine-color-scheme="dark"] .genealogy-canvas {
    background-color: var(--mantine-color-dark-8);
    background-image: radial-gradient(var(--mantine-color-dark-5) 1.5px, transparent 0);
  }

  /* The Wrapper prevents flex-center from clipping content by forcing a physical box size */
  .tree-wrapper {
    display: block;
    min-width: max-content;
    min-height: max-content;
    text-align: center;
    margin: 0 auto;
  }

  .tree-ul { display: inline-flex; padding-top: 20px; position: relative; margin: 0; padding-left: 0; justify-content: center; }
  .tree-li { display: flex; flex-direction: column; align-items: center; list-style-type: none; position: relative; padding: 20px 10px 0 10px; }
  
  .tree-li::before, .tree-li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid var(--mantine-color-gray-5); width: 50%; height: 20px; }
  [data-mantine-color-scheme="dark"] .tree-li::before, [data-mantine-color-scheme="dark"] .tree-li::after { border-color: var(--mantine-color-dark-4); }
  .tree-li::after { right: auto; left: 50%; border-left: 2px solid var(--mantine-color-gray-5); }
  [data-mantine-color-scheme="dark"] .tree-li::after { border-color: var(--mantine-color-dark-4); }
  
  .tree-li:only-child::after, .tree-li:only-child::before { display: none; }
  .tree-li:only-child { padding-top: 0; }
  .tree-li:first-child::before, .tree-li:last-child::after { border: 0 none; }
  .tree-li:last-child::before { border-right: 2px solid var(--mantine-color-gray-5); border-radius: 0 5px 0 0; }
  .tree-li:first-child::after { border-radius: 5px 0 0 0; }
  [data-mantine-color-scheme="dark"] .tree-li:last-child::before { border-color: var(--mantine-color-dark-4); }
  
  .tree-ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid var(--mantine-color-gray-5); width: 0; height: 20px; }
  [data-mantine-color-scheme="dark"] .tree-ul::before { border-color: var(--mantine-color-dark-4); }
  .tree-root > .tree-ul::before { display: none !important; }
`;

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

const formatCurrency = (val, sym) => `${sym}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
const fmtNode = (val) => new Intl.NumberFormat('en-US').format(val || 0);

const GamifiedRankCard = ({ rankData, isDark }) => {
  const getTierDef = () => {
    const lvl = rankData.level;
    if (lvl === 'none') return {
      bg: isDark ? 'linear-gradient(135deg, var(--mantine-color-dark-6), var(--mantine-color-dark-8))' : 'linear-gradient(135deg, var(--mantine-color-gray-1), var(--mantine-color-gray-3))',
      text: isDark ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-dark-8)',
      icon: IconShield, glow: 'none'
    };
    if (['sharer', 'believer', 'builder', 'achiever', 'director'].includes(lvl)) return {
      bg: isDark ? 'linear-gradient(135deg, var(--mantine-color-blue-9), var(--mantine-color-cyan-9))' : 'linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-cyan-5))',
      text: 'white', icon: IconShield, glow: isDark ? '0 0 15px rgba(24, 100, 171, 0.4)' : '0 4px 15px rgba(51, 154, 240, 0.3)'
    };
    if (lvl === 'bronze') return {
      bg: isDark ? 'linear-gradient(135deg, var(--mantine-color-orange-9), var(--mantine-color-yellow-9))' : 'linear-gradient(135deg, var(--mantine-color-orange-5), var(--mantine-color-yellow-5))',
      text: 'white', icon: IconSword, glow: isDark ? '0 0 20px rgba(217, 72, 15, 0.5)' : '0 4px 15px rgba(253, 126, 20, 0.4)'
    };
    if (lvl === 'silver') return {
      bg: isDark ? 'linear-gradient(135deg, var(--mantine-color-gray-7), var(--mantine-color-gray-9))' : 'linear-gradient(135deg, var(--mantine-color-gray-3), var(--mantine-color-gray-4))',
      text: isDark ? 'white' : 'var(--mantine-color-dark-9)', icon: IconSword, glow: '0 4px 15px rgba(134, 142, 150, 0.3)'
    };
    if (lvl === 'ruby') return {
      bg: isDark ? 'linear-gradient(135deg, var(--mantine-color-red-9), var(--mantine-color-pink-9))' : 'linear-gradient(135deg, var(--mantine-color-red-6), var(--mantine-color-pink-6))',
      text: 'white', icon: IconCrown, glow: isDark ? '0 0 25px rgba(224, 49, 49, 0.6)' : '0 4px 20px rgba(250, 82, 82, 0.4)'
    };
    if (lvl === 'emerald') return {
      bg: isDark ? 'linear-gradient(135deg, var(--mantine-color-teal-9), var(--mantine-color-green-9))' : 'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-green-6))',
      text: 'white', icon: IconCrown, glow: isDark ? '0 0 25px rgba(18, 184, 134, 0.6)' : '0 4px 20px rgba(32, 201, 151, 0.4)'
    };
    if (lvl === 'diamond') return {
      bg: 'linear-gradient(135deg, #0b2b36, #1c7ed6)',
      text: 'white', icon: IconDiamond, anim: 'diamondPulse 2s infinite', glow: 'none'
    };
    if (lvl === 'star-diamond') return {
      bg: 'linear-gradient(135deg, #2b0b36, #845ef7)',
      text: 'white', icon: IconDiamond, anim: 'starPulse 2s infinite', glow: 'none'
    };
    return { bg: 'var(--mantine-color-gray-2)', text: 'black', icon: IconShield, glow: 'none' };
  };

  const theme = getTierDef();
  const RankIcon = theme.icon;

  return (
    <Card 
      radius="md" p="lg" h="100%"
      style={{ 
        background: theme.bg,
        boxShadow: theme.glow,
        animation: theme.anim || 'none',
        color: theme.text,
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
        transition: 'all 0.4s ease'
      }}
    >
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600} style={{ opacity: 0.85 }}>Projected Rank</Text>
        <RankIcon size={22} stroke={2} />
      </Group>
      <Title order={2} style={{ textShadow: theme.text === 'white' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none' }}>
        {rankData.name}
      </Title>
      {rankData.stars > 0 && (
        <Text mt={4} fw={800} style={{ letterSpacing: 2, color: '#fcc419', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
          {'★'.repeat(rankData.stars)}
        </Text>
      )}
    </Card>
  );
};

function GenealogySimulator() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  const nodeCounter = useRef(0);
  const [treeState, setTreeState] = useState(null);
  const [pcPsp, setPcPsp] = useState(0);
  const [currency, setCurrency] = useState('PHP');
  const [exchangeRate, setExchangeRate] = useState(55);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState({ type: null, targetId: null });
  const [enrollForm, setEnrollForm] = useState({ isSponsored: false, isNsb: false });

  const metrics = useMemo(() => {
    if (!treeState) {
      return { 
        error: null, commissionPoints: 0, nsbCp: 0, localCurrency: 0, 
        rankData: { name: "None", level: "none", stars: 0 } 
      };
    }
    const clonedTree = structuredClone(treeState);
    const result = simulateInteractiveTree(clonedTree, { psp: pcPsp }, exchangeRate);
    return { ...result, processedTree: clonedTree };
  }, [treeState, pcPsp, exchangeRate]);

  const createNode = (name, isBc1=false, isBc2=false, isBc3=false, psp=0, activationVol=0, isPersonallySponsored=false, nsbActive=false) => {
    nodeCounter.current += 1;
    return {
      id: `node_${nodeCounter.current}`,
      name, psp, activationVol, left: null, right: null,
      isBc1, isBc2, isBc3, leftVol: 0, rightVol: 0, cp: 0,
      isPersonallySponsored, nsbActive
    };
  };

  const updateNodeProperty = useCallback((targetId, prop, value) => {
    setTreeState(prev => {
      const newTree = structuredClone(prev);
      const findAndMutate = (node) => {
        if (!node) return false;
        if (node.id === targetId) { node[prop] = value; return true; }
        return findAndMutate(node.left) || findAndMutate(node.right);
      };
      findAndMutate(newTree);
      return newTree;
    });
  }, []);

  const removeNode = useCallback((targetId) => {
    setTreeState(prev => {
      const newTree = structuredClone(prev);
      const searchAndDestroy = (parent) => {
        if (!parent) return false;
        if (parent.left && parent.left.id === targetId) { parent.left = null; return true; }
        if (parent.right && parent.right.id === targetId) { parent.right = null; return true; }
        return searchAndDestroy(parent.left) || searchAndDestroy(parent.right);
      };
      searchAndDestroy(newTree);
      return newTree;
    });
  }, []);

  const handleOpenModal = (type, targetId = null) => {
    setModalAction({ type, targetId });
    setEnrollForm({ isSponsored: false, isNsb: false });
    setModalOpen(true);
  };

  const executeEnrollment = (enrollType) => {
    const is3BC = enrollType === '3bc';
    const { isSponsored, isNsb } = enrollForm;

    setTreeState(prev => {
      let newTree = prev ? structuredClone(prev) : null;

      if (modalAction.type === 'join') {
        setPcPsp(0);
        if (is3BC) {
          newTree = createNode('Me (BC1)', true, false, false, 0, 200, false, false);
          newTree.left = createNode('Me (BC2)', false, true, false, 0, 150, false, false);
          newTree.right = createNode('Me (BC3)', false, false, true, 0, 150, false, false);
        } else {
          newTree = createNode('Me (BC1)', true, false, false, 0, 200, false, false);
        }
      } else {
        let newPartner;
        if (is3BC) {
          newPartner = createNode('Partner BC1', false, false, false, 0, 200, isSponsored, isNsb);
          newPartner.left = createNode('Partner BC2', false, false, false, 0, 150, isSponsored, isNsb);
          newPartner.right = createNode('Partner BC3', false, false, false, 0, 150, isSponsored, isNsb);
        } else {
          newPartner = createNode('Partner', false, false, false, 0, 200, isSponsored, isNsb);
        }

        const appendChild = (node) => {
          if (!node) return false;
          if (node.id === modalAction.targetId) {
            if (modalAction.type === 'add-left') node.left = newPartner;
            if (modalAction.type === 'add-right') node.right = newPartner;
            return true;
          }
          return appendChild(node.left) || appendChild(node.right);
        };
        appendChild(newTree);
      }
      return newTree;
    });
    setModalOpen(false);
  };

  const TreeNode = ({ node }) => {
    if (!node) return null;
    const isRootBC = node.isBc1 || node.isBc2 || node.isBc3;

    return (
      <li className="tree-li">
        <Paper 
          withBorder shadow={isDark ? "md" : "xl"} radius="md" p="sm" 
          bg={isDark ? 'dark.7' : 'white'}
          style={{ width: 240, position: 'relative', zIndex: 1, borderColor: isRootBC ? 'var(--mantine-color-blue-filled)' : undefined }}
        >
          {(node.isPersonallySponsored || node.nsbActive) && (
            <Group gap={4} mb={8} justify="center">
              {node.isPersonallySponsored && <Badge size="xs" color="violet" variant={isDark ? "light" : "filled"}>SPON</Badge>}
              {node.nsbActive && <Badge size="xs" color="yellow" variant={isDark ? "light" : "filled"}>10% NSB</Badge>}
            </Group>
          )}

          <TextInput 
            size="sm" mb="xs" value={node.name}
            onChange={(e) => updateNodeProperty(node.id, 'name', e.target.value)}
            styles={{ input: { textAlign: 'center', fontWeight: 600 } }}
          />

          <Group grow gap="xs" mb="xs">
            <Paper withBorder p={4} radius="sm" bg={isDark ? 'dark.6' : 'gray.0'} style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed" fw={600}>L GSP</Text>
              <Text size="sm" fw={800} c={isDark ? "blue.4" : "blue.7"}>{fmtNode(node.leftVol)}</Text>
            </Paper>
            <Paper withBorder p={4} radius="sm" bg={isDark ? 'dark.6' : 'gray.0'} style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed" fw={600}>R GSP</Text>
              <Text size="sm" fw={800} c={isDark ? "blue.4" : "blue.7"}>{fmtNode(node.rightVol)}</Text>
            </Paper>
          </Group>

          {isRootBC && (
            <Badge 
              color={node.cp >= 1000 ? 'red' : 'green'} 
              variant="light" size="sm" fullWidth mb="xs"
            >
              {node.cp >= 1000 ? 'MAXED: 1,000 CP' : `Payout: ${fmtNode(node.cp)} CP`}
            </Badge>
          )}

          <Group justify="space-between" wrap="nowrap" mb="xs">
            <Button size="compact-xs" variant="light" color="gray" disabled={!!node.left} onClick={() => handleOpenModal('add-left', node.id)}>+ L</Button>
            {!isRootBC ? (
              <Button size="compact-xs" variant="subtle" color="red" onClick={() => removeNode(node.id)}>X</Button>
            ) : <div style={{width: 24}}></div>}
            <Button size="compact-xs" variant="light" color="gray" disabled={!!node.right} onClick={() => handleOpenModal('add-right', node.id)}>+ R</Button>
          </Group>

          <NumberInput 
            size="xs" label="Personal Volume (PSP)" min={0} step={50} value={node.psp}
            onChange={(val) => updateNodeProperty(node.id, 'psp', Number(val) || 0)}
          />
        </Paper>

        {(node.left || node.right) && (
          <ul className="tree-ul">
            {node.left ? <TreeNode node={node.left} /> : <li className="tree-li" style={{visibility: 'hidden', width: 240}}></li>}
            {node.right ? <TreeNode node={node.right} /> : <li className="tree-li" style={{visibility: 'hidden', width: 240}}></li>}
          </ul>
        )}
      </li>
    );
  };

  return (
    <AppShell header={{ height: 64 }}>
      <style>{customStyles}</style>
      
      <AppShell.Header withBorder={true} bg={isDark ? 'dark.8' : 'white'}>
        <Container size={1600} h="100%">
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
        <Container size={1600} py="xl">
          
          <Grid gutter="lg" mb="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <GamifiedRankCard rankData={metrics.rankData} isDark={isDark} />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow={isDark ? "sm" : "md"} radius="md" withBorder bg={isDark ? 'dark.7' : 'white'} h="100%">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c={isDark ? "dimmed" : "gray.6"} fw={600}>Total Commission Points</Text>
                  <ThemeIcon color="blue" variant="light" size="sm"><IconScale size={14}/></ThemeIcon>
                </Group>
                <Title order={2} c={isDark ? 'white' : 'dark.9'}>{fmtNode(metrics.commissionPoints)} CP</Title>
                {metrics.nsbCp > 0 && (
                  <Text size="xs" c={isDark ? "green.4" : "green.6"} fw={700} mt={4}>Includes {fmtNode(metrics.nsbCp)} CP from NSB</Text>
                )}
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow={isDark ? "sm" : "md"} radius="md" withBorder bg={isDark ? 'dark.7' : 'white'} h="100%">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c={isDark ? "dimmed" : "gray.6"} fw={600}>Projected Income</Text>
                  <ThemeIcon color="green" variant="light" size="sm"><IconTrendingUp size={14}/></ThemeIcon>
                </Group>
                <Title order={2} c={isDark ? "green.5" : "green.7"}>{formatCurrency(metrics.localCurrency, currency === 'PHP' ? '₱' : '$')}</Title>
              </Card>
            </Grid.Col>
          </Grid>

          {metrics.error && (
            <Paper p="sm" mb="xl" bg="red.1" style={{ borderLeft: '4px solid var(--mantine-color-red-6)' }}>
              <Text size="sm" c="red.9" fw={600}>{metrics.error}</Text>
            </Paper>
          )}

          {/* New Horizontal Command Ribbon */}
          <Paper withBorder shadow={isDark ? "sm" : "xs"} radius="md" p="md" mb="xl" bg={isDark ? 'dark.7' : 'white'}>
            <Group justify="space-between" align="flex-end">
              <Group align="flex-end" gap="lg">
                <Select 
                  label="Currency" 
                  value={currency} 
                  onChange={(val) => {
                    setCurrency(val);
                    if (val === 'USD') setExchangeRate(1);
                    if (val === 'PHP' && exchangeRate === 1) setExchangeRate(55);
                  }}
                  data={[{ value: 'PHP', label: 'PHP (₱)' }, { value: 'USD', label: 'USD ($)' }]} 
                  w={120}
                />
                <NumberInput 
                  label="Conversion Rate" 
                  value={exchangeRate} 
                  onChange={(val) => setExchangeRate(Number(val) || 1)} 
                  min={1} 
                  w={140}
                />
                {treeState && (
                  <NumberInput 
                    size="sm" value={pcPsp} onChange={(val) => setPcPsp(Number(val) || 0)} 
                    min={0} step={50} label="Preferred Customer Vol (PSP)" 
                    w={220}
                  />
                )}
              </Group>
              <Button 
                variant="outline" color="red" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear the entire genealogy?")) {
                    setTreeState(null);
                    setPcPsp(0);
                    nodeCounter.current = 0;
                  }
                }}
              >
                Reset Genealogy
              </Button>
            </Group>
          </Paper>

          {/* Full-Width Infinite Canvas */}
          <Paper withBorder shadow={isDark ? "sm" : "md"} radius="md" p={0} bg={isDark ? 'dark.7' : 'white'} style={{ overflow: 'hidden' }}>
            <div className="genealogy-canvas">
              {!treeState ? (
                <Stack align="center" justify="center" h="100%">
                  <IconUserPlus size={48} color="var(--mantine-color-blue-filled)" />
                  <Title order={3} c={isDark ? "white" : "dark.9"}>Start Your Business</Title>
                  <Text c="dimmed" ta="center" maw={400}>Enroll with USANA to establish your Business Center structure and begin building your network.</Text>
                  <Button mt="md" onClick={() => handleOpenModal('join')}>Join USANA</Button>
                </Stack>
              ) : (
                <div className="tree-wrapper">
                  <ul className="tree-ul tree-root">
                    <TreeNode node={metrics.processedTree} />
                  </ul>
                </div>
              )}
            </div>
          </Paper>
        </Container>
      </AppShell.Main>

      <Modal 
        opened={modalOpen} onClose={() => setModalOpen(false)} 
        title={<Title order={4}>{modalAction.type === 'join' ? 'Join USANA' : 'Enroll Partner'}</Title>} 
        centered
      >
        <Text size="sm" c="dimmed" mb="lg">Select the enrollment package to establish the Business Center structure and inject initial Personal Sales Points (PSP).</Text>
        
        {modalAction.type !== 'join' && (
          <Paper withBorder p="sm" mb="lg" radius="md" bg={isDark ? 'dark.6' : 'gray.0'}>
            <Checkbox 
              label="Personally Sponsored" mb="xs"
              checked={enrollForm.isSponsored}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setEnrollForm({ isSponsored: checked, isNsb: checked });
              }}
            />
            <Checkbox 
              label="NSB Active (Within First 6 Months)" 
              disabled={!enrollForm.isSponsored}
              checked={enrollForm.isNsb}
              onChange={(e) => setEnrollForm({ ...enrollForm, isNsb: e.currentTarget.checked })}
            />
          </Paper>
        )}

        <Grid>
          <Grid.Col span={6}>
            <Button variant="default" h={80} fullWidth style={{ display: 'flex', flexDirection: 'column' }} onClick={() => executeEnrollment('1bc')}>
              <Text fw={700}>1 Business Center</Text>
              <Text size="xs" c="dimmed">200 PSP</Text>
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button variant="light" color="blue" h={80} fullWidth style={{ display: 'flex', flexDirection: 'column' }} onClick={() => executeEnrollment('3bc')}>
              <Text fw={700}>3 Business Centers</Text>
              <Text size="xs">500 PSP</Text>
            </Button>
          </Grid.Col>
        </Grid>
      </Modal>
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
              <Title order={3} c="red.9">Critical Render Error</Title>
              <Text c="red.9" mb="xs">{this.state.error?.toString()}</Text>
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
      <GenealogySimulator />
    </MantineProvider>
  </ErrorBoundary>
);