import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, AppShell, Group, Title, Text, Button, 
  Container, Paper, Grid, Badge, TextInput, NumberInput, 
  Select, Modal, FileInput, Stack, Avatar, ActionIcon,
  Textarea, Divider, SegmentedControl, Autocomplete,
  useMantineColorScheme, useComputedColorScheme
} from '@mantine/core';
import { IconSun, IconMoon, IconTrash, IconPlus, IconPrinter, IconDeviceFloppy } from '@tabler/icons-react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community';

import '@mantine/core/styles.css';

import { storageAdapter } from '../../shared/storage-adapter.js';
import { resolvePath } from '../../shared/base-path.js';
import { exportToCSV, parseCSV } from '../../shared/import-export/csv.js';
import { calculateNextReminderDate } from '../../shared/calc-engine/receipts-calc.js';

ModuleRegistry.registerModules([AllCommunityModule]);

const PRODUCT_CATALOG = [
  { name: "CellSentials", price: 4430, units: 224, unitLabel: "tablets" },
  { name: "Mini CellSentials", price: 1335, units: 56, unitLabel: "tablets" },
  { name: "Usanimals", price: 1680, units: 56, unitLabel: "tablets" },
  { name: "USANA Probiotic", price: 2040, units: 14, unitLabel: "packets" },
  { name: "Vitamin D", price: 1800, units: 56, unitLabel: "tablets" },
  { name: "Proflavanol C100", price: 3720, units: 56, unitLabel: "tablets" },
  { name: "Digestive Enzyme", price: 2020, units: 56, unitLabel: "tablets" },
  { name: "ProCalm+", price: 2020, units: 56, unitLabel: "tablets" },
  { name: "MagneCal D", price: 2340, units: 112, unitLabel: "tablets" },
  { name: "BiOmega", price: 2700, units: 56, unitLabel: "gelcaps" },
  { name: "CoQuinone 30", price: 4105, units: 56, unitLabel: "gelcaps" },
  { name: "CopaPrime+", price: 3100, units: 56, unitLabel: "tablets" },
  { name: "Palmetto Plus", price: 3280, units: 30, unitLabel: "gelcaps" },
  { name: "Poly C", price: 1920, units: 120, unitLabel: "tablets" },
  { name: "Procosa", price: 3100, units: 84, unitLabel: "tablets" },
  { name: "Visionex", price: 3280, units: 56, unitLabel: "tablets" },
  { name: "Hepasil DTX", price: 3530, units: 84, unitLabel: "tablets" },
  { name: "Pure Rest SF", price: 1400, units: 56, unitLabel: "tablets" },
  { name: "Proglucamune", price: 2640, units: 56, unitLabel: "tablets" },
  { name: "USANA Advanced Collagen", price: 2520, units: 14, unitLabel: "packets" },
  { name: "Nutrimeal Dutch Chocolate", price: 2340, units: 9, unitLabel: "servings" },
  { name: "Nutrimeal French Vanilla", price: 2340, units: 9, unitLabel: "servings" },
  { name: "Nutrimeal Wild Strawberry", price: 2340, units: 9, unitLabel: "servings" },
  { name: "Active+ Supplement", price: 2340, units: 84, unitLabel: "tablets" },
  { name: "USANA DTX Tea Mix", price: 1840, units: 28, unitLabel: "packets" },
  { name: "Fibergy Active", price: 2220, units: 28, unitLabel: "servings" },
  { name: "Nutrimeal + Soy Chocolate", price: 3350, units: 14, unitLabel: "servings" },
  { name: "Nutrimeal + Soy Vanilla", price: 3350, units: 14, unitLabel: "servings" },
  { name: "Creamy Foam Cleanser", price: 2270, units: 1, unitLabel: "unit" },
  { name: "Bi-Phase Makeup Remover", price: 2160, units: 1, unitLabel: "unit" },
  { name: "Perfecting Toner", price: 2400, units: 1, unitLabel: "unit" },
  { name: "Vitalizing Serum", price: 6600, units: 1, unitLabel: "unit" },
  { name: "Resurfacing Serum", price: 6600, units: 1, unitLabel: "unit" },
  { name: "Triple Action Eye Cream", price: 6000, units: 1, unitLabel: "unit" },
  { name: "Protective Day Lotion", price: 2400, units: 1, unitLabel: "unit" },
  { name: "Contouring Face & Neck Crème", price: 6000, units: 1, unitLabel: "unit" },
  { name: "Exfoliating Charcoal Facial Mask + Scrub", price: 1900, units: 1, unitLabel: "unit" },
  { name: "Hydrating + Lifting Sheet Mask", price: 1515, units: 3, unitLabel: "masks" },
  { name: "Postbiotic Barrier Balm", price: 2340, units: 1, unitLabel: "unit" },
  { name: "Postbiotic Rescue Serum", price: 2880, units: 1, unitLabel: "unit" },
  { name: "Postbiotic Calming Cleanser", price: 2520, units: 1, unitLabel: "unit" },
  { name: "Postbiotic Soothing Moisturizer", price: 2760, units: 1, unitLabel: "unit" },
  { name: "Whitening Toothpaste", price: 580, units: 1, unitLabel: "unit" }
];

const catalogNames = PRODUCT_CATALOG.map(p => p.name);

const formatPHP = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);

const generateInvoiceId = () => {
  const d = new Date();
  const pad = (n, m = 2) => String(n).padStart(m, '0');
  return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getMilliseconds(), 3)}`;
};

const printStyles = `
  @media print {
    body { background: white !important; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .mantine-AppShell-header { display: none !important; }
    .mantine-AppShell-main { padding: 0 !important; background: white !important; }
    .invoice-paper { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; border: none !important; padding: 0 !important; }
    .product-info-block { page-break-inside: avoid; }
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

function ReceiptGenerator() {
  const computedScheme = useComputedColorScheme('light');
  const isDark = computedScheme === 'dark';

  const [view, setView] = useState('editor');
  
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fullCatalog, setFullCatalog] = useState([]);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importData, setImportData] = useState(null);

  const [invoiceData, setInvoiceData] = useState({
    id: generateInvoiceId(),
    date: new Date().toISOString().split('T')[0],
    status: 'paid',
    cycleDays: 30,
    clientName: '',
    clientDetails: '',
    discount: 0
  });
  
  const [lineItems, setLineItems] = useState([
    { id: crypto.randomUUID(), productName: '', quantity: 1, units: 1, unitLabel: 'tablets', unitPrice: 0 }
  ]);

  const loadData = useCallback(async () => {
    const p = await storageAdapter.list('purchases') || [];
    const c = await storageAdapter.list('customers') || [];
    setPurchases(p);
    setCustomers(c);

    try {
      const res = await fetch(resolvePath('data/products.json'));
      if (res.ok) {
        const catalogData = await res.json();
        setFullCatalog(catalogData);
      }
    } catch (err) {
      console.warn('Failed to load rich product catalog for descriptions.');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRowClick = useCallback((event) => {
    const record = event.data;
    if (!record) return;

    const customer = customers.find(c => c.id === record.customerId) || { name: '', contact: '' };

    let calculatedCycleDays = 30;
    if (record.date && record.nextReminderDate) {
      const d1 = new Date(record.date);
      const d2 = new Date(record.nextReminderDate);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        calculatedCycleDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      }
    }

    setInvoiceData({
      id: record.id,
      date: record.date || new Date().toISOString().split('T')[0],
      status: record.paymentStatus || 'paid',
      cycleDays: calculatedCycleDays,
      clientName: customer.name,
      clientDetails: customer.contact || '',
      discount: record.discountPct || 0
    });

    const parsedItems = Array.isArray(record.lineItems) ? record.lineItems : [];
    const loadedItems = parsedItems.map(item => ({
      id: crypto.randomUUID(),
      productName: item.productName || '',
      quantity: item.quantity || 1,
      units: item.units || 1,
      unitLabel: item.unitLabel || 'tablets',
      unitPrice: item.unitPrice || 0
    }));

    setLineItems(loadedItems.length > 0 ? loadedItems : [{ id: crypto.randomUUID(), productName: '', quantity: 1, units: 1, unitLabel: 'tablets', unitPrice: 0 }]);
    setView('editor');
  }, [customers]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => {
    return subtotal * ((invoiceData.discount || 0) / 100);
  }, [subtotal, invoiceData.discount]);

  const totalDue = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const purchasedProductDetails = useMemo(() => {
    if (!fullCatalog || fullCatalog.length === 0) return [];
    const uniqueNames = [...new Set(lineItems.map(item => item.productName).filter(Boolean))];
    
    return uniqueNames.map(name => {
      const match = fullCatalog.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
      if (match) {
        return { name: match.name, overview: match.overview, benefits: match.benefits };
      }
      return null;
    }).filter(Boolean);
  }, [lineItems, fullCatalog]);

  const handleSaveInvoice = async () => {
    const { clientName, clientDetails, id, date, status, cycleDays, discount } = invoiceData;
    
    if (!clientName.trim()) return alert("Customer Name is required.");
    if (lineItems.length === 0 || !lineItems[0].productName.trim()) return alert("At least one named product is required.");

    let customerId = crypto.randomUUID();
    const existingCust = customers.find(c => c.name.toLowerCase() === clientName.trim().toLowerCase());
    if (existingCust) {
      customerId = existingCust.id;
    } else {
      await storageAdapter.set('customers', {
        id: customerId,
        name: clientName.trim(),
        contact: clientDetails,
        createdAt: new Date().toISOString()
      });
    }

    const cleanItems = lineItems.map(({ productName, quantity, units, unitLabel, unitPrice }) => ({ 
      productName, quantity, units, unitLabel, unitPrice 
    }));

    const purchaseRecord = {
      id: id || generateInvoiceId(),
      customerId,
      date,
      lineItems: cleanItems,
      subtotal,
      discountPct: discount,
      discountAmount,
      total: totalDue,
      paymentStatus: status,
      nextReminderDate: calculateNextReminderDate(date, cycleDays)
    };

    await storageAdapter.set('purchases', purchaseRecord);
    alert('Invoice saved successfully!');
    
    setInvoiceData({
      ...invoiceData,
      id: generateInvoiceId(),
      clientName: '',
      clientDetails: '',
      discount: 0
    });
    setLineItems([{ id: crypto.randomUUID(), productName: '', quantity: 1, units: 1, unitLabel: 'tablets', unitPrice: 0 }]);
    await loadData();
    setView('list');
  };

  const handleExport = () => {
    const exportData = purchases.map(p => ({
      ...p,
      lineItems: JSON.stringify(p.lineItems)
    }));
    exportToCSV(exportData, `receipts_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      const expectedHeaders = ['id', 'customerId', 'date', 'lineItems', 'total', 'paymentStatus', 'nextReminderDate'];
      const parsed = await parseCSV(file, expectedHeaders);
      setImportData(parsed);
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmImport = async () => {
    if (!importData) return;
    for (const item of importData) {
      item.total = Number(item.total) || 0;
      try {
        item.lineItems = typeof item.lineItems === 'string' ? JSON.parse(item.lineItems) : item.lineItems;
      } catch (e) {
        item.lineItems = []; 
      }
      
      const s = item.paymentStatus?.toLowerCase();
      if (s === 'unpaid') item.paymentStatus = 'pending';
      else if (!['paid', 'pending', 'partial'].includes(s)) item.paymentStatus = 'paid';
      
      await storageAdapter.set('purchases', item);
    }
    setImportData(null);
    setIsImportOpen(false);
    alert('Import successful.');
    await loadData();
  };

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'Invoice ID', width: 220 },
    { field: 'date', headerName: 'Date', width: 130, sort: 'desc' },
    { 
      field: 'customerId', headerName: 'Customer', flex: 1,
      cellRenderer: (params) => {
        if (!params.value) return null;
        const cust = customers.find(c => c.id === params.value);
        return <Text size="sm" fw={500}>{cust ? cust.name : 'Unknown'}</Text>;
      }
    },
    { 
      field: 'paymentStatus', headerName: 'Status', width: 120,
      cellRenderer: (params) => {
        if (!params.value) return null;
        const colors = { paid: 'teal', pending: 'orange', partial: 'blue' };
        return (
          <Group h="100%" align="center">
            <Badge color={colors[params.value] || 'gray'} variant="light">
              {params.value.toUpperCase()}
            </Badge>
          </Group>
        );
      }
    },
    { field: 'nextReminderDate', headerName: 'Reminder Due', width: 140 },
    { 
      field: 'total', headerName: 'Total', width: 140,
      cellRenderer: (params) => {
        if (params.value === undefined) return null;
        return (
          <Group h="100%" align="center" justify="flex-end" w="100%" pr="md">
            <Text size="sm" fw={700}>{formatPHP(params.value)}</Text>
          </Group>
        );
      }
    }
  ], [customers]);

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
      }),
    [isDark]
  );

  return (
    <AppShell header={{ height: 64 }} bg={isDark ? 'dark.8' : 'gray.0'}>
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
          
          <Group justify="space-between" mb="lg" className="no-print">
            <SegmentedControl 
              value={view} 
              onChange={setView}
              data={[
                { label: 'New Invoice', value: 'editor' },
                { label: 'History Dashboard', value: 'list' }
              ]}
              color="blue"
            />
          </Group>

          {view === 'list' && (
            <div className="no-print" style={{ height: 'calc(100vh - 180px)', width: '100%', borderRadius: 8, overflow: 'hidden', border: isDark ? '1px solid var(--mantine-color-dark-4)' : '1px solid var(--mantine-color-gray-3)' }}>
              <AgGridReact
                theme={gridTheme} 
                rowData={purchases} 
                columnDefs={columnDefs}
                defaultColDef={{ resizable: true, sortable: true }}
                rowSelection="single" 
                onRowClicked={handleRowClick}
                animateRows={true} 
                rowHeight={50} 
                headerHeight={50} 
                suppressCellFocus={true}
              />
            </div>
          )}

          {view === 'editor' && (
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 5 }} className="no-print">
                <Paper withBorder p="md" radius="md" shadow="sm" bg={isDark ? 'dark.7' : 'white'} mb="md">
                  <Group justify="space-between" mb="md">
                    <Title order={5}>Invoice Details</Title>
                    <Group gap="xs">
                      <Button variant="light" color="blue" size="xs" leftSection={<IconPrinter size={16}/>} onClick={() => window.print()}>Print PDF</Button>
                      <Button color="blue" size="xs" leftSection={<IconDeviceFloppy size={16}/>} onClick={handleSaveInvoice}>Save</Button>
                    </Group>
                  </Group>

                  <Grid mb="md">
                    <Grid.Col span={6}><TextInput label="Invoice Number" value={invoiceData.id} onChange={e => setInvoiceData({...invoiceData, id: e.target.value})} /></Grid.Col>
                    <Grid.Col span={6}><TextInput type="date" label="Date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} /></Grid.Col>
                    <Grid.Col span={4}>
                      <Select label="Status" value={invoiceData.status} onChange={val => setInvoiceData({...invoiceData, status: val})}
                        data={[{value: 'paid', label: 'Paid'}, {value: 'pending', label: 'Pending'}, {value: 'partial', label: 'Partial'}]}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}><NumberInput label="Discount (%)" max={100} value={invoiceData.discount} onChange={val => setInvoiceData({...invoiceData, discount: val})} min={0} /></Grid.Col>
                    <Grid.Col span={4}><NumberInput label="Replenish (Days)" value={invoiceData.cycleDays} onChange={val => setInvoiceData({...invoiceData, cycleDays: val})} min={0} /></Grid.Col>
                  </Grid>

                  <Divider my="sm" label="Customer Information" labelPosition="center" />
                  
                  <TextInput label="Customer Name" placeholder="Jane Doe" mb="sm" value={invoiceData.clientName} onChange={e => setInvoiceData({...invoiceData, clientName: e.target.value})} />
                  <Textarea label="Address & Contact" placeholder="Email, Phone, Shipping Address..." minRows={2} mb="md" value={invoiceData.clientDetails} onChange={e => setInvoiceData({...invoiceData, clientDetails: e.target.value})} />

                  <Divider my="sm" label="Line Items" labelPosition="center" />

                  <Stack gap="xs" mb="md">
                    {lineItems.map((item, index) => (
                      <Group key={item.id} wrap="nowrap" align="flex-end">
                        <Autocomplete
                          style={{ flex: 3 }}
                          placeholder="Product name"
                          data={catalogNames}
                          value={item.productName}
                          onChange={(val) => {
                            const newItems = [...lineItems];
                            newItems[index].productName = val;
                            const matched = PRODUCT_CATALOG.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
                            if (matched) {
                              newItems[index].unitPrice = matched.price;
                              newItems[index].units = matched.units;
                              newItems[index].unitLabel = matched.unitLabel;
                            }
                            setLineItems(newItems);
                          }}
                        />
                        <NumberInput style={{ flex: 1.5 }} label="Units" min={1} value={item.units} onChange={val => {
                          const newItems = [...lineItems]; newItems[index].units = val || 1; setLineItems(newItems);
                        }} />
                        <NumberInput style={{ flex: 1 }} label="Qty" min={1} value={item.quantity} onChange={val => {
                          const newItems = [...lineItems]; newItems[index].quantity = val || 1; setLineItems(newItems);
                        }} />
                        <NumberInput style={{ flex: 2 }} label="Price" prefix="₱ " decimalScale={2} value={item.unitPrice} onChange={val => {
                          const newItems = [...lineItems]; newItems[index].unitPrice = val || 0; setLineItems(newItems);
                        }} />
                        <ActionIcon color="red" variant="subtle" size="lg" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))} disabled={lineItems.length === 1}>
                          <IconTrash size={20} />
                        </ActionIcon>
                      </Group>
                    ))}
                  </Stack>
                  <Button fullWidth variant="light" leftSection={<IconPlus size={16}/>} onClick={() => setLineItems([...lineItems, { id: crypto.randomUUID(), productName: '', quantity: 1, units: 1, unitLabel: 'tablets', unitPrice: 0 }])}>
                    Add Product
                  </Button>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 7 }}>
                <Paper 
                  className="invoice-paper"
                  withBorder 
                  shadow="md" 
                  radius="sm" 
                  p="xl" 
                  bg="white" 
                  c="black"
                  style={{ minHeight: '297mm', position: 'relative', overflow: 'hidden' }}
                >
                  {invoiceData.status === 'paid' && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '8rem', fontWeight: 900, color: 'rgba(22, 163, 74, 0.05)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0 }}>
                      PAID
                    </div>
                  )}

                  <Group justify="space-between" align="flex-start" mb="xl" style={{ position: 'relative', zIndex: 1 }}>
                    <div>
                      <Title order={1} c="dark.9" style={{ letterSpacing: '2px', textTransform: 'uppercase' }}>Invoice</Title>
                      <Text c={invoiceData.status === 'paid' ? 'teal.7' : 'orange.6'} fw={700} style={{ textTransform: 'uppercase' }}>
                        Status: {invoiceData.status}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Group justify="flex-end" mb={4}>
                        <img src={resolvePath('favicon.svg')} alt="Logo" style={{ height: 24, width: 24 }} />
                        <Text fw={800} size="lg">USANA Empire</Text>
                      </Group>
                      <Text size="sm" c="dimmed">Independent Distributor</Text>
                    </div>
                  </Group>

                  <Grid mb="xl" style={{ position: 'relative', zIndex: 1 }}>
                    <Grid.Col span={6}>
                      <Text size="xs" fw={700} c="gray.6" style={{ textTransform: 'uppercase' }}>Bill To</Text>
                      <Text fw={700} size="lg">{invoiceData.clientName || 'Client Name'}</Text>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{invoiceData.clientDetails}</Text>
                    </Grid.Col>
                    <Grid.Col span={6} style={{ textAlign: 'right' }}>
                      <Text size="sm"><Text component="span" fw={700}>Invoice #:</Text> {invoiceData.id}</Text>
                      <Text size="sm"><Text component="span" fw={700}>Date:</Text> {invoiceData.date}</Text>
                    </Grid.Col>
                  </Grid>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px', color: '#495057' }}>Description</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: '#495057' }}>Qty</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: '#495057' }}>Unit Price</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: '#495057' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <Text size="sm" fw={500}>{item.productName || <em style={{color: '#adb5bd'}}>Product Name</em>}</Text>
                            {item.units > 1 && (
                              <Text size="xs" c="dimmed" mt={2}>
                                {item.units} {item.unitLabel || 'tablets'} @ {formatPHP(item.unitPrice / item.units)}/each
                              </Text>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatPHP(item.unitPrice)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{formatPHP(item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Group justify="space-between" align="flex-end" style={{ position: 'relative', zIndex: 1 }}>
                    <div>
                      <Text size="xs" fw={700} c="gray.6" tt="uppercase" mb="xs">Scan to Pay</Text>
                      <div style={{ padding: 8, border: '1px solid #e9ecef', borderRadius: 8, display: 'inline-block', backgroundColor: 'white' }}>
                        <img 
                          src={resolvePath('images/maya-qr.jpg')} 
                          alt="Maya QR Code" 
                          style={{ width: 120, height: 120, objectFit: 'contain', display: 'block' }} 
                        />
                      </div>
                    </div>
                    
                    <Paper bg="gray.0" p="md" radius="sm" style={{ minWidth: '280px' }}>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm">Subtotal</Text>
                        <Text size="sm" fw={600}>{formatPHP(subtotal)}</Text>
                      </Group>
                      {invoiceData.discount > 0 && (
                        <Group justify="space-between" mb="xs">
                          <Text size="sm">Discount ({invoiceData.discount}%)</Text>
                          <Text size="sm" fw={600} c="red">-{formatPHP(discountAmount)}</Text>
                        </Group>
                      )}
                      <Divider my="sm" />
                      <Group justify="space-between">
                        <Text size="lg" fw={500}>Total Due</Text>
                        <Text size="xl" fw={800} c="blue.9">{formatPHP(totalDue)}</Text>
                      </Group>
                    </Paper>
                  </Group>

                  {purchasedProductDetails.length > 0 && (
                    <div style={{ marginTop: '3rem', position: 'relative', zIndex: 1 }}>
                      <Divider my="md" label="Product Information & Guidance" labelPosition="center" />
                      <Stack gap="md">
                        {purchasedProductDetails.map((prod, idx) => (
                          <div key={idx} className="product-info-block">
                            <Text size="sm" fw={700} mb={4}>{prod.name}</Text>
                            <Text size="xs" c="dimmed" mb={4}>{prod.overview}</Text>
                            {prod.benefits && prod.benefits.length > 0 && (
                              <Text size="xs" c="dimmed">
                                <Text component="span" fw={600}>Key Benefits: </Text> 
                                {prod.benefits.join(' • ')}
                              </Text>
                            )}
                          </div>
                        ))}
                      </Stack>
                      <Text size="xs" c="dimmed" ta="center" mt="xl" style={{ fontStyle: 'italic' }}>
                        These products are not intended to diagnose, treat, cure, or prevent any disease.
                      </Text>
                    </div>
                  )}
                </Paper>
              </Grid.Col>
            </Grid>
          )}

        </Container>
      </AppShell.Main>

      <Modal opened={isImportOpen} onClose={() => { setIsImportOpen(false); setImportData(null); }} title={<Text fw={700}>Import Receipts (CSV)</Text>} centered className="no-print">
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
      <ReceiptGenerator />
    </MantineProvider>
  </ErrorBoundary>
);