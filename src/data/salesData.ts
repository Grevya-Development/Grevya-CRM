export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  currency: string;
  pricingTiers: PricingTier[];
  discounts: Discount[];
  bundles: string[];
  contractTerms: ContractTerm[];
  status: 'active' | 'inactive' | 'discontinued';
  description: string;
  createdAt: string;
}

export interface PricingTier {
  id: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  pricePerUnit: number;
}

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  validFrom: string;
  validTo: string;
  conditions: string;
}

export interface ContractTerm {
  id: string;
  name: string;
  duration: string;
  discount: number;
  terms: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  version: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired' | 'converted';
  customerId: string;
  customerName: string;
  companyName: string;
  salesPersonId: string;
  salesPersonName: string;
  territory: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  validUntil: string;
  approvalStatus: 'pending' | 'level1' | 'level2' | 'final';
  approvers: Approver[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Approver {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  date?: string;
  comments?: string;
}

export interface SalesPerson {
  id: string;
  name: string;
  email: string;
  territory: string;
  region: string;
  manager: string;
  quotesCount: number;
  conversionRate: number;
  totalRevenue: number;
}

export interface Territory {
  id: string;
  name: string;
  region: string;
  salesPersons: string[];
  quotesCount: number;
  revenue: number;
}

// Sample Data
export const products: Product[] = [
  {
    id: '1',
    name: 'CRM Enterprise Suite',
    sku: 'CRM-ENT-001',
    category: 'Software',
    basePrice: 999,
    currency: 'INR',
    pricingTiers: [
      { id: '1', name: 'Standard', minQuantity: 1, maxQuantity: 10, pricePerUnit: 999 },
      { id: '2', name: 'Business', minQuantity: 11, maxQuantity: 50, pricePerUnit: 899 },
      { id: '3', name: 'Enterprise', minQuantity: 51, maxQuantity: 1000, pricePerUnit: 749 },
    ],
    discounts: [
      { id: '1', name: 'Early Bird', type: 'percentage', value: 10, validFrom: '2024-12-01', validTo: '2024-12-31', conditions: 'First 100 customers' },
    ],
    bundles: ['2', '3'],
    contractTerms: [
      { id: '1', name: 'Annual', duration: '12 months', discount: 15, terms: 'Annual commitment required' },
      { id: '2', name: 'Multi-Year', duration: '36 months', discount: 25, terms: 'Three year lock-in' },
    ],
    status: 'active',
    description: 'Complete CRM solution for enterprise',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Analytics Module',
    sku: 'ANA-MOD-002',
    category: 'Add-on',
    basePrice: 299,
    currency: 'INR',
    pricingTiers: [
      { id: '1', name: 'Standard', minQuantity: 1, maxQuantity: 100, pricePerUnit: 299 },
    ],
    discounts: [],
    bundles: [],
    contractTerms: [
      { id: '1', name: 'Monthly', duration: '1 month', discount: 0, terms: 'Cancel anytime' },
    ],
    status: 'active',
    description: 'Advanced analytics and reporting',
    createdAt: '2024-02-15',
  },
  {
    id: '3',
    name: 'Integration Platform',
    sku: 'INT-PLT-003',
    category: 'Platform',
    basePrice: 499,
    currency: 'INR',
    pricingTiers: [
      { id: '1', name: 'Basic', minQuantity: 1, maxQuantity: 5, pricePerUnit: 499 },
      { id: '2', name: 'Pro', minQuantity: 6, maxQuantity: 50, pricePerUnit: 449 },
    ],
    discounts: [
      { id: '1', name: 'Bundle Discount', type: 'percentage', value: 20, validFrom: '2024-01-01', validTo: '2025-12-31', conditions: 'When purchased with CRM Suite' },
    ],
    bundles: ['1'],
    contractTerms: [
      { id: '1', name: 'Annual', duration: '12 months', discount: 10, terms: 'Annual billing' },
    ],
    status: 'active',
    description: 'Connect with any ERP system',
    createdAt: '2024-03-01',
  },
  {
    id: '4',
    name: 'Mobile Access Pack',
    sku: 'MOB-ACC-004',
    category: 'Add-on',
    basePrice: 149,
    currency: 'INR',
    pricingTiers: [
      { id: '1', name: 'Per User', minQuantity: 1, maxQuantity: 1000, pricePerUnit: 149 },
    ],
    discounts: [],
    bundles: ['1'],
    contractTerms: [],
    status: 'active',
    description: 'Mobile app for iOS and Android',
    createdAt: '2024-04-01',
  },
  {
    id: '5',
    name: 'AI Assistant Pro',
    sku: 'AI-AST-005',
    category: 'AI',
    basePrice: 599,
    currency: 'INR',
    pricingTiers: [
      { id: '1', name: 'Standard', minQuantity: 1, maxQuantity: 25, pricePerUnit: 599 },
      { id: '2', name: 'Enterprise', minQuantity: 26, maxQuantity: 500, pricePerUnit: 499 },
    ],
    discounts: [
      { id: '1', name: 'Launch Offer', type: 'fixed', value: 100, validFrom: '2024-12-01', validTo: '2025-01-31', conditions: 'New customers only' },
    ],
    bundles: [],
    contractTerms: [
      { id: '1', name: 'Annual', duration: '12 months', discount: 20, terms: 'AI usage limits apply' },
    ],
    status: 'active',
    description: 'AI-powered assistant for sales automation',
    createdAt: '2024-06-01',
  },
];

export const quotes: Quote[] = [
  {
    id: '1',
    quoteNumber: 'QT-2024-001',
    version: 2,
    status: 'approved',
    customerId: '1',
    customerName: 'Sarah Johnson',
    companyName: 'TechCorp Inc.',
    salesPersonId: '1',
    salesPersonName: 'Rahul Sharma',
    territory: 'North India',
    items: [
      { id: '1', productId: '1', productName: 'CRM Enterprise Suite', quantity: 50, unitPrice: 899, discount: 10, total: 40455 },
      { id: '2', productId: '2', productName: 'Analytics Module', quantity: 50, unitPrice: 299, discount: 0, total: 14950 },
    ],
    subtotal: 55405,
    discount: 5540,
    tax: 8973,
    total: 58838,
    currency: 'INR',
    validUntil: '2025-01-15',
    approvalStatus: 'final',
    approvers: [
      { id: '1', name: 'Priya Patel', role: 'Sales Manager', status: 'approved', date: '2024-12-01', comments: 'Good Leads' },
      { id: '2', name: 'Vikram Singh', role: 'Director', status: 'approved', date: '2024-12-02' },
    ],
    notes: 'Priority customer - expedite delivery',
    createdAt: '2024-11-25',
    updatedAt: '2024-12-02',
  },
  {
    id: '2',
    quoteNumber: 'QT-2024-002',
    version: 1,
    status: 'pending',
    customerId: '2',
    customerName: 'Michael Chen',
    companyName: 'Innovate.io',
    salesPersonId: '2',
    salesPersonName: 'Anita Desai',
    territory: 'West India',
    items: [
      { id: '1', productId: '1', productName: 'CRM Enterprise Suite', quantity: 25, unitPrice: 899, discount: 5, total: 21351 },
      { id: '2', productId: '5', productName: 'AI Assistant Pro', quantity: 25, unitPrice: 499, discount: 10, total: 11227 },
    ],
    subtotal: 32578,
    discount: 3258,
    tax: 5278,
    total: 34598,
    currency: 'INR',
    validUntil: '2025-01-30',
    approvalStatus: 'level1',
    approvers: [
      { id: '1', name: 'Priya Patel', role: 'Sales Manager', status: 'approved', date: '2024-12-05' },
      { id: '2', name: 'Vikram Singh', role: 'Director', status: 'pending' },
    ],
    notes: 'Competitor comparison pending',
    createdAt: '2024-12-01',
    updatedAt: '2024-12-05',
  },
  {
    id: '3',
    quoteNumber: 'QT-2024-003',
    version: 3,
    status: 'draft',
    customerId: '3',
    customerName: 'Emily Rodriguez',
    companyName: 'GlobalTech',
    salesPersonId: '3',
    salesPersonName: 'Karthik Nair',
    territory: 'South India',
    items: [
      { id: '1', productId: '1', productName: 'CRM Enterprise Suite', quantity: 100, unitPrice: 749, discount: 15, total: 63665 },
      { id: '2', productId: '3', productName: 'Integration Platform', quantity: 100, unitPrice: 449, discount: 20, total: 35920 },
      { id: '3', productId: '4', productName: 'Mobile Access Pack', quantity: 100, unitPrice: 149, discount: 0, total: 14900 },
    ],
    subtotal: 114485,
    discount: 17173,
    tax: 17512,
    total: 114824,
    currency: 'INR',
    validUntil: '2025-02-28',
    approvalStatus: 'pending',
    approvers: [],
    notes: 'Large enterprise Leads - need executive approval',
    createdAt: '2024-12-03',
    updatedAt: '2024-12-08',
  },
  {
    id: '4',
    quoteNumber: 'QT-2024-004',
    version: 1,
    status: 'converted',
    customerId: '4',
    customerName: 'David Kim',
    companyName: 'StartupX',
    salesPersonId: '1',
    salesPersonName: 'Rahul Sharma',
    territory: 'North India',
    items: [
      { id: '1', productId: '1', productName: 'CRM Enterprise Suite', quantity: 10, unitPrice: 999, discount: 0, total: 9990 },
    ],
    subtotal: 9990,
    discount: 0,
    tax: 1798,
    total: 11788,
    currency: 'INR',
    validUntil: '2024-12-15',
    approvalStatus: 'final',
    approvers: [
      { id: '1', name: 'Priya Patel', role: 'Sales Manager', status: 'approved', date: '2024-11-20' },
    ],
    notes: 'Converted to order on 2024-11-25',
    createdAt: '2024-11-15',
    updatedAt: '2024-11-25',
  },
  {
    id: '5',
    quoteNumber: 'QT-2024-005',
    version: 1,
    status: 'rejected',
    customerId: '5',
    customerName: 'Lisa Thompson',
    companyName: 'Enterprise Co',
    salesPersonId: '2',
    salesPersonName: 'Anita Desai',
    territory: 'West India',
    items: [
      { id: '1', productId: '5', productName: 'AI Assistant Pro', quantity: 50, unitPrice: 499, discount: 25, total: 18713 },
    ],
    subtotal: 18713,
    discount: 4678,
    tax: 2526,
    total: 16561,
    currency: 'INR',
    validUntil: '2024-12-01',
    approvalStatus: 'final',
    approvers: [
      { id: '1', name: 'Vikram Singh', role: 'Director', status: 'rejected', date: '2024-11-28', comments: 'Discount too high' },
    ],
    notes: 'Rejected due to excessive discount request',
    createdAt: '2024-11-20',
    updatedAt: '2024-11-28',
  },
];

export const salesPersons: SalesPerson[] = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul.sharma@company.com', territory: 'North India', region: 'India', manager: 'Priya Patel', quotesCount: 45, conversionRate: 72, totalRevenue: 2500000 },
  { id: '2', name: 'Anita Desai', email: 'anita.desai@company.com', territory: 'West India', region: 'India', manager: 'Priya Patel', quotesCount: 38, conversionRate: 68, totalRevenue: 1800000 },
  { id: '3', name: 'Karthik Nair', email: 'karthik.nair@company.com', territory: 'South India', region: 'India', manager: 'Vikram Singh', quotesCount: 52, conversionRate: 75, totalRevenue: 3200000 },
  { id: '4', name: 'Meera Reddy', email: 'meera.reddy@company.com', territory: 'East India', region: 'India', manager: 'Vikram Singh', quotesCount: 31, conversionRate: 65, totalRevenue: 1400000 },
  { id: '5', name: 'Arjun Kapoor', email: 'arjun.kapoor@company.com', territory: 'Central India', region: 'India', manager: 'Priya Patel', quotesCount: 28, conversionRate: 70, totalRevenue: 1600000 },
];

export const territories: Territory[] = [
  { id: '1', name: 'North India', region: 'India', salesPersons: ['1'], quotesCount: 45, revenue: 2500000 },
  { id: '2', name: 'West India', region: 'India', salesPersons: ['2'], quotesCount: 38, revenue: 1800000 },
  { id: '3', name: 'South India', region: 'India', salesPersons: ['3'], quotesCount: 52, revenue: 3200000 },
  { id: '4', name: 'East India', region: 'India', salesPersons: ['4'], quotesCount: 31, revenue: 1400000 },
  { id: '5', name: 'Central India', region: 'India', salesPersons: ['5'], quotesCount: 28, revenue: 1600000 },
];

export const orderWorkflow = [
  { id: '1', stage: 'Quote Created', status: 'completed', date: '2024-11-15' },
  { id: '2', stage: 'Quote Approved', status: 'completed', date: '2024-11-20' },
  { id: '3', stage: 'Order Created', status: 'completed', date: '2024-11-25' },
  { id: '4', stage: 'ERP Sync', status: 'completed', date: '2024-11-25' },
  { id: '5', stage: 'Invoice Generated', status: 'in-progress', date: '2024-12-01' },
  { id: '6', stage: 'Payment Received', status: 'pending', date: null },
  { id: '7', stage: 'Order Fulfilled', status: 'pending', date: null },
];
