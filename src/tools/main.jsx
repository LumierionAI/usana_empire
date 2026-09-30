import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, AppShell, Group, Title, Text, Button, 
  useMantineColorScheme, useComputedColorScheme, Container, 
  Card, SimpleGrid, Badge, Stack, Avatar
} from '@mantine/core';
import { 
  IconStethoscope, IconHierarchy, IconReceipt, 
  IconWallet, IconUsersGroup, IconArrowRight, IconSun, IconMoon, IconRocket 
} from '@tabler/icons-react';

import '@mantine/core/styles.css';

import { resolvePath } from '../shared/base-path.js';

// --- Cinematic Hover Interactions ---
const globalStyles = `
  .tool-card {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease;
    display: flex;
    flex-direction: column;
    min-height: 280px; /* Fixed height so grid doesn't jump */
  }
  
  .tool-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--mantine-shadow-xl);
    border-color: var(--mantine-color-blue-filled);
  }

  /* Default Mobile/Touch State (Always visible, normal size) */
  .animated-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--mantine-radius-md);
    width: 48px;
    height: 48px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .icon-svg {
    width: 28px;
    height: 28px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animated-title {
    font-size: 1.125rem;
    font-weight: 700;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .top-section {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Desktop Cinematic Hover Effect */
  @media (hover: hover) {
    /* 1. Idle State: Large and centered */
    .tool-card:not(.locked-card) .top-section {
      transform: translateY(45px); /* Push down into the center */
    }
    
    .tool-card:not(.locked-card) .animated-icon {
      width: 72px;
      height: 72px;
    }
    
    .tool-card:not(.locked-card) .icon-svg {
      width: 40px;
      height: 40px;
    }
    
    .tool-card:not(.locked-card) .animated-title {
      font-size: 1.4rem;
      margin-top: 0.5rem;
    }

    .reveal-wrapper {
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      transform: translateY(20px);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* 2. Hover State: Contract to top, reveal content */
    .tool-card:not(.locked-card):hover .top-section {
      transform: translateY(0); /* Snap back to top */
    }

    .tool-card:not(.locked-card):hover .animated-icon {
      width: 48px;
      height: 48px;
    }

    .tool-card:not(.locked-card):hover .icon-svg {
      width: 28px;
      height: 28px;
    }

    .tool-card:not(.locked-card):hover .animated-title {
      font-size: 1.125rem;
      margin-top: 0;
    }

    .tool-card:not(.locked-card):hover .reveal-wrapper {
      opacity: 1;
      max-height: 150px;
      transform: translateY(0);
      margin-top: 1rem;
    }

    /* Keep disabled card strictly in its final state */
    .locked-card .reveal-wrapper {
      opacity: 1;
      max-height: 150px;
      transform: translateY(0);
      margin-top: 1rem;
    }
  }
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

const tools = [
  { title: 'Product Guidance', desc: 'Generate rule-based product recommendations utilizing compliance-approved logic.', link: './guidance/', icon: IconStethoscope, color: 'teal', badge: 'Consultation' },
  { title: 'Genealogy Simulator', desc: 'Model downline growth, project structural volume, and estimate commissions.', link: './genealogy/', icon: IconHierarchy, color: 'violet', badge: 'Analysis' },
  { title: 'Prospect Planner', desc: 'Manage your contact network, track follow-ups, and monitor pipeline status.', link: './prospects/', icon: IconUsersGroup, color: 'blue', badge: 'CRM Pipeline' },
  { title: 'Financial Ledger', desc: 'Track local retail revenues, operational expenses, and calculate total net profit.', link: './ledger/', icon: IconWallet, color: 'green', badge: 'Finance' },
  { title: 'Receipt Generator', desc: 'Create professional customer invoices and automate replenishment reminders.', link: './receipts/', icon: IconReceipt, color: 'orange', badge: 'Operations' },
  { title: 'More Tools Coming Soon', desc: 'Future workspace modules and analytics are currently in development.', link: '#', icon: IconRocket, color: 'gray', badge: 'In Development', disabled: true }
];

function ToolsDashboard() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  return (
    <AppShell header={{ height: 64 }} bg={isDark ? 'dark.8' : 'gray.0'}>
      <style>{globalStyles}</style>
      
      <AppShell.Header withBorder={true}>
        <Container size="lg" h="100%">
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
            <Group><ThemeToggle /></Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py={40}>
          <Stack gap="xs" mb={40}>
            <Title order={1} c={isDark ? 'white' : 'dark.9'} style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>
              Command Center
            </Title>
            <Text size="lg" c="dimmed" maw={1200}>
              Your private operations toolkit. All data is stored locally and securely on your device. Select a module to begin.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {tools.map((tool) => (
              <Card 
                key={tool.title} 
                component={tool.disabled ? 'div' : 'a'} 
                href={tool.disabled ? undefined : tool.link} 
                className={`tool-card ${tool.disabled ? 'locked-card' : ''}`}
                shadow="sm" padding="xl" radius="md" withBorder 
                bg={isDark ? 'dark.7' : 'white'}
                style={{ 
                  textDecoration: 'none', 
                  opacity: tool.disabled ? 0.6 : 1, 
                  cursor: tool.disabled ? 'default' : 'pointer'
                }}
              >
                
                {/* TOP SECTION: Shifts up and shrinks on hover */}
                <div className="top-section">
                  <Group justify="space-between" align="flex-start" mb="sm">
                    {/* Custom DOM for the Icon so we can freely transition its size */}
                    <div 
                      className="animated-icon" 
                      style={{ 
                        backgroundColor: `var(--mantine-color-${tool.color}-light)`, 
                        color: `var(--mantine-color-${tool.color}-light-color)` 
                      }}
                    >
                      <tool.icon className="icon-svg" stroke={1.5} />
                    </div>
                    <Badge color={tool.color} variant={tool.disabled ? 'outline' : 'dot'}>{tool.badge}</Badge>
                  </Group>
                  <Title className="animated-title" order={4} c={isDark ? 'white' : 'dark.9'}>{tool.title}</Title>
                </div>
                
                {/* BOTTOM SECTION: Reveals and expands on hover */}
                <div className="reveal-wrapper" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Text size="sm" c="dimmed" style={{ flexGrow: 1, lineHeight: 1.6 }} mb="xl">{tool.desc}</Text>
                  <Group justify="flex-end" mt="auto">
                    <Button 
                      variant="subtle" color={tool.color} size="sm" 
                      rightSection={tool.disabled ? null : <IconArrowRight size={16} />} 
                      px={0} 
                      style={{ backgroundColor: 'transparent', cursor: tool.disabled ? 'default' : 'pointer' }}
                      tabIndex={tool.disabled ? -1 : 0}
                    >
                      {tool.disabled ? 'Locked' : 'Launch Tool'}
                    </Button>
                  </Group>
                </div>

              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

const container = document.getElementById('app-mount');
const root = createRoot(container);
root.render(
  <MantineProvider defaultColorScheme="auto">
    <ToolsDashboard />
  </MantineProvider>
);