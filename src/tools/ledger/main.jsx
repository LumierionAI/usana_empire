import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, Paper, TextInput, Select, NumberInput, 
  Button, Group, Title, Grid, Badge, Card, SimpleGrid,
  useMantineColorScheme, useComputedColorScheme, AppShell, 
  SegmentedControl, Container, Text, Avatar, ThemeIcon, Modal, FileInput, Stack
} from '@mantine/core';
import { LineChart } from '@mantine/charts';
import { IconTrendingUp, IconTrendingDown, IconScale } from '@tabler/icons-react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';

import { storageAdapter } from '../../shared/storage-adapter.js';
import { resolvePath } from '../../shared/base-path.js';
import { exportToCSV, parseCSV } from '../../shared/import-export/csv.js';

ModuleRegistry.registerModules([AllCommunityModule]);

const formatPHP = (value) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);
};

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

function FinancialLedger() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState(getEmptyForm());
  const [isEditing, setIsEditing] = useState(false);

  // CSV Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importData, setImportData] = useState(null);

  function getEmptyForm() {
    return {
      id: null,
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: '',
      description: '',
      amount: ''
    };
  }

  const loadData = useCallback(async () => {
    try {
      const rawData = await storageAdapter.list('ledger') || [];
      
      if (!Array.isArray(rawData)) {
        console.warn("Corrupt database schema. Resetting ledger view.");
        setEntries([]);
        return;
      }

      const normalizedData = rawData
        .filter(item => item && typeof item === 'object' && !Array.isArray(item))
        .map(item => {
          let safeType = item.type;
          if (safeType === 'sale' || safeType === 'commission') safeType = 'income';
          if (safeType === 'inventory') safeType = 'expense';
          
          return { 
            ...item, 
            type: safeType || 'income', 
            amount: Number(item.amount) || 0 
          };
      });
      
      setEntries(normalizedData);
    } catch (err) {
      console.error("Fatal error loading ledger data:", err);
      setEntries([]); 
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    let inc = 0, exp = 0;
    entries.forEach(item => {
      if (item.type === 'income') inc += item.amount;
      else exp += item.amount;
    });
    return { totalIncome: inc, totalExpense: exp, netProfit: inc - exp };
  }, [entries]);

  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    const dailyNet = {};
    
    entries.forEach(entry => {
      if (!entry.date) return;
      const dateKey = entry.date.split('T')[0];
      if (!dailyNet[dateKey]) dailyNet[dateKey] = 0;
      
      if (entry.type === 'income') dailyNet[dateKey] += entry.amount;
      else dailyNet[dateKey] -= entry.amount;
    });

    const sortedDates = Object.keys(dailyNet).sort((a, b) => new Date(a) - new Date(b));

    const cumulativeData = [];
    let runningBalance = 0;

    sortedDates.forEach(dateKey => {
      runningBalance += dailyNet[dateKey];
      
      const [y, m, d] = dateKey.split('-');
      const dateObj = new Date(y, m - 1, d);
      const label = isNaN(dateObj) ? dateKey : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      cumulativeData.push({ label, Balance: runningBalance });
    });

    return cumulativeData;
  }, [entries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const entryData = {
      ...formData,
      id: formData.id || crypto.randomUUID(),
      amount: Number(formData.amount) || 0,
      createdAt: formData.id ? formData.createdAt : new Date().toISOString()
    };
    await storageAdapter.set('ledger', entryData);
    setFormData(getEmptyForm());
    setIsEditing(false);
    await loadData();
  };

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Delete this financial record permanently?")) {
      await storageAdapter.delete('ledger', id);
      setFormData(prev => (prev.id === id ? getEmptyForm() : prev));
      await loadData();
    }
  }, [loadData]);

  const handleEdit = useCallback((record) => {
    setFormData(record);
    setIsEditing(true);
  }, []);

  // --- CSV Handlers ---
  const handleExport = () => {
    exportToCSV(entries, `ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      const expectedHeaders = ['id', 'date', 'type', 'category', 'description', 'amount', 'createdAt'];
      const parsed = await parseCSV(file, expectedHeaders);
      setImportData(parsed);
    } catch (err) {
      alert(err.message); 
    }
  };

  const confirmImport = async () => {
    if (!importData) return;
    for (const item of importData) {
      item.amount = Number(item.amount) || 0;
      
      // Ensure legacy types are normalized on import
      let safeType = item.type;
      if (safeType === 'sale' || safeType === 'commission') safeType = 'income';
      if (safeType === 'inventory') safeType = 'expense';
      item.type = safeType || 'income';

      await storageAdapter.set('ledger', item);
    }
    setImportData(null);
    setIsImportOpen(false);
    alert('Import successful.');
    await loadData();
  };

  const categoryOptions = formData.type === 'income' 
    ? ['Retail Profit', 'Weekly Commission', 'Bonus', 'Other Income']
    : ['Product Restock', 'Marketing/Ads', 'Software/Tools', 'Event Tickets', 'Shipping', 'Other Expense'];

  const columnDefs = useMemo(() => [
    { 
      field: 'date', headerName: 'Date', width: 140, sort: 'desc',
      cellRenderer: (params) => {
        if (!params.value) return null;
        try {
          const cleanString = typeof params.value === 'string' ? params.value.split('T')[0] : '';
          if (!cleanString) throw new Error();
          
          const [y, m, d] = cleanString.split('-');
          const localDate = new Date(y, m - 1, d);
          
          if (isNaN(localDate.getTime())) throw new Error();
          
          return (
            <Group h="100%" align="center">
              <Text size="sm" fw={600}>{localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            </Group>
          );
        } catch (e) {
          return <Group h="100%" align="center"><Text size="sm" c="red" fs="italic">Invalid</Text></Group>;
        }
      }
    },
    { 
      field: 'type', headerName: 'Type', width: 120, filter: true,
      cellRenderer: (params) => {
        if (!params.value) return null;
        return (
          <Group h="100%" align="center">
            <Badge color={params.value === 'income' ? 'teal' : 'red'} variant="light" size="md">
              {params.value === 'income' ? 'Income' : 'Expense'}
            </Badge>
          </Group>
        );
      } 
    },
    { 
      field: 'category', headerName: 'Category', flex: 1, filter: true,
      cellRenderer: (params) => <Group h="100%" align="center"><Text size="sm" fw={500}>{params.value || 'Uncategorized'}</Text></Group>
    },
    { 
      field: 'description', headerName: 'Description', flex: 1.5,
      cellRenderer: (params) => (
        <Group h="100%" align="center" style={{ overflow: 'hidden' }}>
          <Text size="sm" c="dimmed" truncate="end" title={params.value}>{params.value || '—'}</Text>
        </Group>
      )
    },
    { 
      field: 'amount', headerName: 'Amount', width: 150,
      cellRenderer: (params) => {
        if (!params.data) return null; 
        
        const isIncome = params.data.type === 'income';
        return (
          <Group h="100%" align="center" justify="flex-end" w="100%" pr="md">
            <Text size="sm" fw={700} c={isIncome ? 'teal.6' : 'red.5'}>
              {isIncome ? '+' : '-'}{formatPHP(params.value)}
            </Text>
          </Group>
        );
      }
    },
    {
      headerName: 'Actions', width: 120, sortable: false, filter: false,
      cellRenderer: (params) => {
        if (!params.data) return null;
        
        return (
          <Group gap="xs" wrap="nowrap" h="100%" align="center">
            <Button size="compact-xs" variant="light" onClick={() => handleEdit(params.data)}>Edit</Button>
            <Button size="compact-xs" color="red" variant="subtle" onClick={() => handleDelete(params.data.id)}>Del</Button>
          </Group>
        );
      }
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
      <style>{`body { background-color: ${isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)'} !important; }`}</style>
      
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
            <Group>
              <Button variant="default" size="sm" onClick={handleExport}>Export CSV</Button>
              <Button variant="default" size="sm" onClick={() => setIsImportOpen(true)}>Import CSV</Button>
              <ThemeToggle />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" py="md">
          
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="md">
            <Card shadow="sm" radius="md" withBorder bg={isDark ? 'dark.7' : 'white'}>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Total Income</Text>
                <ThemeIcon color="teal" variant="light" size="sm"><IconTrendingUp size={14}/></ThemeIcon>
              </Group>
              <Title order={3} c={isDark ? 'white' : 'dark.9'}>{formatPHP(totalIncome)}</Title>
            </Card>
            <Card shadow="sm" radius="md" withBorder bg={isDark ? 'dark.7' : 'white'}>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Total Expenses</Text>
                <ThemeIcon color="red" variant="light" size="sm"><IconTrendingDown size={14}/></ThemeIcon>
              </Group>
              <Title order={3} c={isDark ? 'white' : 'dark.9'}>{formatPHP(totalExpense)}</Title>
            </Card>
            <Card shadow="sm" radius="md" withBorder bg={isDark ? 'dark.7' : 'white'}>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Net Profit</Text>
                <ThemeIcon color={netProfit >= 0 ? 'blue' : 'orange'} variant="light" size="sm"><IconScale size={14}/></ThemeIcon>
              </Group>
              <Title order={3} c={netProfit >= 0 ? (isDark ? 'white' : 'dark.9') : 'red.5'}>
                {formatPHP(netProfit)}
              </Title>
            </Card>
          </SimpleGrid>

          {chartData.length > 0 && (
            <Paper p="xl" radius="md" withBorder shadow="sm" mb="md" bg={isDark ? 'dark.7' : 'white'}>
              <Group justify="space-between" align="flex-end" mb="lg">
                <Title order={5} c={isDark ? 'gray.3' : 'gray.7'}>Cumulative Cash Flow Trend</Title>
                <Badge color={netProfit >= 0 ? 'teal.5' : 'red.5'} variant="light">
                  {netProfit >= 0 ? 'Profitable' : 'Deficit'}
                </Badge>
              </Group>
              
              <LineChart
                h={280}
                data={chartData}
                dataKey="label"
                series={[{ name: 'Balance', color: 'cyan.5' }]}
                curveType="linear"
                strokeWidth={3}
                withDots={true}
                dotProps={{ r: 4, strokeWidth: 2, fill: isDark ? 'var(--mantine-color-dark-7)' : 'white' }}
                activeDotProps={{ r: 6, strokeWidth: 2, fill: 'var(--mantine-color-cyan-5)' }}
                valueFormatter={formatPHP}
                gridAxis="none"
                yAxisProps={{ domain: [dataMin => Math.min(0, dataMin), 'auto'] }}
                referenceLines={[{ 
                  y: 0, 
                  color: isDark ? 'var(--mantine-color-dark-3)' : 'var(--mantine-color-gray-4)',
                  strokeDasharray: '4 4'
                }]}
              />
            </Paper>
          )}

          <Paper p="xl" radius="md" withBorder shadow="sm" mb="md">
            <Group justify="space-between" mb="lg">
              <Title order={4} c="blue">{isEditing ? 'Edit Transaction' : 'Record Transaction'}</Title>
              {isEditing && <Button color="red" variant="subtle" size="xs" onClick={() => handleDelete(formData.id)}>Delete Record</Button>}
            </Group>
            
            <form onSubmit={handleSubmit}>
              <Grid align="flex-end" gutter="md">
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Text size="sm" fw={500} mb={3}>Transaction Type</Text>
                  <SegmentedControl 
                    fullWidth color={formData.type === 'income' ? 'teal' : 'red'}
                    data={[ { label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' } ]}
                    value={formData.type} 
                    onChange={(val) => setFormData({...formData, type: val, category: ''})}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <TextInput type="date" label="Date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select label="Category" required data={categoryOptions} value={formData.category} onChange={(val) => setFormData({...formData, category: val})} placeholder="Select..." />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput label="Description" placeholder="Order ID or Details" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <NumberInput label="Amount (₱)" required min={0} value={formData.amount} onChange={(val) => setFormData({...formData, amount: val})} prefix="₱ " decimalScale={2} fixedDecimalScale />
                </Grid.Col>
                
                <Grid.Col span={12}>
                  <Group justify="flex-end">
                    {isEditing && <Button variant="default" onClick={() => { setFormData(getEmptyForm()); setIsEditing(false); }}>Cancel</Button>}
                    <Button type="submit" color="blue">{isEditing ? 'Update Transaction' : 'Save Transaction'}</Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </form>
          </Paper>

          <div style={{ height: 500, width: '100%', borderRadius: 8, overflow: 'hidden', border: isDark ? '1px solid var(--mantine-color-dark-4)' : '1px solid var(--mantine-color-gray-3)' }}>
            <AgGridReact
              theme={gridTheme} rowData={entries} columnDefs={columnDefs}
              defaultColDef={{ resizable: true, sortable: true }}
              rowSelection="single" animateRows={true} rowHeight={60} headerHeight={50} suppressCellFocus={true}
            />
          </div>

        </Container>
      </AppShell.Main>

      <Modal opened={isImportOpen} onClose={() => { setIsImportOpen(false); setImportData(null); }} title={<Text fw={700}>Import Ledger (CSV)</Text>} centered>
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
    <FinancialLedger />
  </MantineProvider>
);