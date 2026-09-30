import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, Paper, TextInput, Select, Checkbox, 
  Button, Group, Textarea, Title, Grid, Badge, Stack, 
  useMantineColorScheme, useComputedColorScheme, AppShell, 
  SegmentedControl, Container, Text, Avatar, Modal, FileInput
} from '@mantine/core';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community';

import '@mantine/core/styles.css';

import { storageAdapter } from '../../shared/storage-adapter.js';
import { exportToCSV, parseCSV } from '../../shared/import-export/csv.js';
import { resolvePath } from '../../shared/base-path.js';

ModuleRegistry.registerModules([AllCommunityModule]);

function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';
  
  return (
    <Button variant="default" size="sm" onClick={() => toggleColorScheme()}>
      {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </Button>
  );
}

function ProspectPlanner() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  const [prospects, setProspects] = useState([]);
  const [formData, setFormData] = useState(getEmptyForm());
  const [isEditing, setIsEditing] = useState(false);
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importData, setImportData] = useState(null);

  function getEmptyForm() {
    return {
      id: null, name: '', contact: '', status: 'New', temperature: 'cold',
      hasMeans: false, hasAuthority: false, hasNeeds: false,
      nextFollowupDate: '', notes: ''
    };
  }

  const loadData = useCallback(async () => {
    const data = await storageAdapter.list('prospects') || [];
    setProspects(data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let priorityScore = 0;
    if (formData.hasMeans) priorityScore++;
    if (formData.hasAuthority) priorityScore++;
    if (formData.hasNeeds) priorityScore++;

    const entryData = {
      ...formData,
      id: formData.id || crypto.randomUUID(),
      priorityScore,
      createdAt: formData.id ? formData.createdAt : new Date().toISOString()
    };

    await storageAdapter.set('prospects', entryData);
    setFormData(getEmptyForm());
    setIsEditing(false);
    await loadData();
  };

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this prospect?")) {
      await storageAdapter.delete('prospects', id);
      setFormData(prev => {
        if (prev.id === id) {
          setIsEditing(false);
          return getEmptyForm();
        }
        return prev;
      });
      await loadData();
    }
  }, [loadData]);

  const handleEdit = useCallback((prospect) => {
    setFormData(prospect);
    setIsEditing(true);
  }, []);

  const handleExport = () => {
    exportToCSV(prospects, `prospects_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      const expectedHeaders = ['id', 'name', 'contact', 'status', 'temperature', 'hasMeans', 'hasAuthority', 'hasNeeds', 'priorityScore', 'nextFollowupDate', 'notes', 'createdAt'];
      const parsed = await parseCSV(file, expectedHeaders);
      setImportData(parsed);
    } catch (err) {
      alert(err.message); 
    }
  };

  const confirmImport = async () => {
    if (!importData) return;
    for (const item of importData) {
      item.hasMeans = item.hasMeans === 'true' || item.hasMeans === true;
      item.hasAuthority = item.hasAuthority === 'true' || item.hasAuthority === true;
      item.hasNeeds = item.hasNeeds === 'true' || item.hasNeeds === true;
      item.priorityScore = parseInt(item.priorityScore, 10) || 0;
      await storageAdapter.set('prospects', item);
    }
    setImportData(null);
    setIsImportOpen(false);
    alert('Import successful.');
    await loadData();
  };

  const pipelineOptions = ['New', 'Need Follow up', 'Preferred Customer', 'Retail Customer', 'Brand Partner', 'Rejected'];

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'blue';
      case 'Need Follow up': return 'orange';
      case 'Preferred Customer': return 'teal';
      case 'Retail Customer': return 'green';
      case 'Brand Partner': return 'grape';
      case 'Rejected': return 'red';
      default: return 'gray';
    }
  };

  const columnDefs = useMemo(() => [
    { 
      field: 'name', headerName: 'Prospect', flex: 1.2, filter: true,
      cellRenderer: (params) => {
        const name = params.value || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        return (
          <Group gap="sm" wrap="nowrap" h="100%" align="center">
            <Avatar color="blue" radius="xl" size="sm">{initials}</Avatar>
            <Text fw={600} size="sm" truncate="end">{name}</Text>
          </Group>
        );
      }
    },
    { 
      field: 'contact', headerName: 'Contact Info', flex: 1.2,
      cellRenderer: (params) => (
        <Group h="100%" align="center"><Text size="sm" c="dimmed" truncate="end">{params.value || '—'}</Text></Group>
      )
    },
    { 
      field: 'status', headerName: 'Pipeline Stage', width: 160, filter: true,
      cellRenderer: (params) => (
        <Group h="100%" align="center">
          <Badge color={getStatusColor(params.value)} variant="light" size="md" radius="sm" fw={700}>{params.value}</Badge>
        </Group>
      ) 
    },
    { 
      field: 'temperature', headerName: 'Temp', width: 100,
      cellRenderer: (params) => {
        const colors = { hot: 'red', warm: 'orange', cold: 'cyan' };
        return (
          <Group h="100%" align="center">
            <Badge color={colors[params.value]} variant="dot" size="md" style={{ textTransform: 'capitalize' }}>{params.value}</Badge>
          </Group>
        );
      }
    },
    { 
      field: 'priorityScore', headerName: 'MAN', width: 90, 
      cellRenderer: (params) => (
        <Group h="100%" align="center">
          <Text size="sm" fw={700} c={params.value > 0 ? undefined : 'dimmed'}>P{params.value || 0}</Text>
        </Group>
      )
    },
    { 
      field: 'nextFollowupDate', headerName: 'Follow Up', sort: 'asc', width: 130,
      cellRenderer: (params) => {
        if (!params.value) return (<Group h="100%" align="center"><Text size="sm" c="dimmed">No date</Text></Group>);
        const [y, m, d] = params.value.split('-');
        const localDate = new Date(y, m - 1, d);
        return (
          <Group h="100%" align="center">
            <Text size="sm" fw={600}>{localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </Group>
        );
      }
    },
    { 
      field: 'notes', headerName: 'Notes', flex: 1.5,
      cellRenderer: (params) => (
        <Group h="100%" align="center" style={{ overflow: 'hidden' }}>
          <Text size="sm" c="dimmed" truncate="end" title={params.value}>{params.value || '—'}</Text>
        </Group>
      )
    },
    {
      headerName: 'Actions', width: 140, sortable: false, filter: false,
      cellRenderer: (params) => (
        <Group gap="xs" wrap="nowrap" h="100%" align="center">
          <Button size="compact-xs" variant="light" onClick={() => handleEdit(params.data)}>Edit</Button>
          <Button size="compact-xs" color="red" variant="subtle" onClick={() => handleDelete(params.data.id)}>Del</Button>
        </Group>
      )
    }
  ], [handleEdit, handleDelete]);

  const gridTheme = useMemo(() => 
    themeQuartz
      .withPart(isDark ? colorSchemeDark : colorSchemeLight)
      .withParams({
        fontFamily: 'var(--mantine-font-family)',
        backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : '#ffffff',
        foregroundColor: isDark ? 'var(--mantine-color-dark-0)' : '#000000',
        borderColor: isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)',
        headerBackgroundColor: isDark ? 'var(--mantine-color-dark-6)' : '#f8fafc',
        headerTextColor: isDark ? 'var(--mantine-color-dark-1)' : '#475569',
        rowHoverColor: isDark ? 'var(--mantine-color-dark-5)' : '#f1f5f9',
        headerColumnBorder: false,
        headerColumnResizeHandleDisplay: 'none',
        cellHorizontalPadding: 16,
      }),
    [isDark]
  );

  return (
    <AppShell header={{ height: 64 }} bg={isDark ? 'dark.8' : 'gray.0'}>
      <AppShell.Header withBorder={true}>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            
            {/* Premium Global Navigation */}
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
            
            {/* Tool-Specific Action Area */}
            <Group>
              <Button variant="default" size="sm" onClick={handleExport}>Export CSV</Button>
              <Button variant="default" size="sm" onClick={() => setIsImportOpen(true)}>Import CSV</Button>
              <ThemeToggle />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" h="calc(100vh - 84px)" style={{ display: 'flex', flexDirection: 'column' }}>
          
          <Paper p="xl" radius="md" withBorder shadow="sm" mb="md" mt="md">
            <Group justify="space-between" mb="lg">
              <Title order={4} c="blue">{isEditing ? 'Edit Prospect Record' : 'Add New Prospect'}</Title>
              {isEditing && <Button color="red" variant="subtle" size="xs" onClick={() => handleDelete(formData.id)}>Delete Record</Button>}
            </Group>
            
            <form onSubmit={handleSubmit}>
              <Grid align="flex-end" gutter="md">
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput label="Name" required placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput label="Contact Info" placeholder="Phone or Email" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select label="Pipeline Status" data={pipelineOptions} value={formData.status} onChange={(val) => setFormData({...formData, status: val})} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput type="date" label="Next Follow-up" value={formData.nextFollowupDate} onChange={(e) => setFormData({...formData, nextFollowupDate: e.target.value})} />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Text size="sm" fw={500} mb={3}>Temperature</Text>
                  <SegmentedControl fullWidth data={[{ label: 'Cold', value: 'cold' }, { label: 'Warm', value: 'warm' }, { label: 'Hot', value: 'hot' }]} value={formData.temperature} onChange={(val) => setFormData({...formData, temperature: val})} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Checkbox.Group label="Qualification (MAN)" value={['hasMeans', 'hasAuthority', 'hasNeeds'].filter(key => formData[key])} onChange={(vals) => setFormData({ ...formData, hasMeans: vals.includes('hasMeans'), hasAuthority: vals.includes('hasAuthority'), hasNeeds: vals.includes('hasNeeds') })}>
                    <Group mt="xs" gap="sm">
                      <Checkbox value="hasMeans" label="Means" size="sm" />
                      <Checkbox value="hasAuthority" label="Authority" size="sm" />
                      <Checkbox value="hasNeeds" label="Needs" size="sm" />
                    </Group>
                  </Checkbox.Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Textarea label="Notes" placeholder="Context from last meeting..." minRows={1} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Group justify="flex-end" wrap="nowrap">
                    {isEditing && <Button variant="default" onClick={() => { setFormData(getEmptyForm()); setIsEditing(false); }}>Cancel</Button>}
                    <Button type="submit" color="blue" fullWidth>{isEditing ? 'Update' : 'Save'}</Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </form>
          </Paper>

          <div style={{ 
            flex: 1, 
            width: '100%', 
            minHeight: 400, 
            borderRadius: 8, 
            overflow: 'hidden',
            border: isDark ? '1px solid var(--mantine-color-dark-4)' : '1px solid var(--mantine-color-gray-3)' 
          }}>
            <AgGridReact
              theme={gridTheme}
              rowData={prospects}
              columnDefs={columnDefs}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
              rowSelection="single"
              animateRows={true}
              rowHeight={60}
              headerHeight={50}
              suppressCellFocus={true}
            />
          </div>
        </Container>
      </AppShell.Main>

      <Modal opened={isImportOpen} onClose={() => { setIsImportOpen(false); setImportData(null); }} title={<Text fw={700}>Import Prospects (CSV)</Text>} centered>
        {!importData ? (
          <FileInput label="Upload CSV File" placeholder="Click to select file" accept=".csv" onChange={handleFileSelect} size="md" mb="md" />
        ) : (
          <Stack>
            <Text fw={600} c="green">Validated! Ready to import {importData.length} records.</Text>
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setImportData(null)}>Cancel</Button>
              <Button color="blue" onClick={confirmImport}>Confirm Import</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </AppShell>
  );
}

const container = document.getElementById('app-mount');
const root = createRoot(container);
root.render(
  <MantineProvider defaultColorScheme="auto">
    <ProspectPlanner />
  </MantineProvider>
);