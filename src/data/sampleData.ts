export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  avatar?: string;
  createdAt: string;
  lastContact: string;
}

export interface Leads {
  id: string;
  title: string;
  value: number;
  stage: 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  contactId: string;
  contactName: string;
  companyId: string;
  companyName: string;
  expectedCloseDate: string;
  createdAt: string;
  ownerName: string;
  nextActivity: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  revenue: string;
  website: string;
  phone: string;
  address: string;
  contactCount: number;
  LeadsCount: number;
  totalValue: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignee: string;
  relatedTo: string;
  type: 'call' | 'email' | 'meeting' | 'task';
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'Leads';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  relatedTo: string;
}

export interface ApprovalRequest {
  id: string;
  LeadsTitle: string;
  LeadsValue: number;
  ownerName: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'discount' | 'credit-terms' | 'special-concession';
  companyName: string;
  priority: 'low' | 'medium' | 'high';
}

export const contacts: Contact[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@techcorp.com', phone: '+1 (555) 123-4567', company: 'TechCorp Inc.', position: 'CTO', status: 'customer', createdAt: '2024-01-15', lastContact: '2024-12-05' },
  { id: '2', name: 'Michael Chen', email: 'michael.chen@innovate.io', phone: '+1 (555) 234-5678', company: 'Innovate.io', position: 'CEO', status: 'prospect', createdAt: '2024-02-20', lastContact: '2024-12-03' },
  { id: '3', name: 'Emily Rodriguez', email: 'emily.r@globaltech.com', phone: '+1 (555) 345-6789', company: 'GlobalTech', position: 'VP Sales', status: 'lead', createdAt: '2024-03-10', lastContact: '2024-12-01' },
  { id: '4', name: 'David Kim', email: 'david.kim@startupx.com', phone: '+1 (555) 456-7890', company: 'StartupX', position: 'Founder', status: 'customer', createdAt: '2024-01-05', lastContact: '2024-12-06' },
  { id: '5', name: 'Lisa Thompson', email: 'lisa.t@enterprise.co', phone: '+1 (555) 567-8901', company: 'Enterprise Co', position: 'Director', status: 'prospect', createdAt: '2024-04-15', lastContact: '2024-11-28' },
  { id: '6', name: 'James Wilson', email: 'james.w@solutions.net', phone: '+1 (555) 678-9012', company: 'Solutions Net', position: 'Manager', status: 'lead', createdAt: '2024-05-20', lastContact: '2024-12-02' },
  { id: '7', name: 'Amanda Foster', email: 'amanda.f@bigdata.ai', phone: '+1 (555) 789-0123', company: 'BigData AI', position: 'CIO', status: 'customer', createdAt: '2024-02-01', lastContact: '2024-12-04' },
  { id: '8', name: 'Robert Martinez', email: 'robert.m@cloudserv.com', phone: '+1 (555) 890-1234', company: 'CloudServ', position: 'VP Engineering', status: 'churned', createdAt: '2024-01-20', lastContact: '2024-10-15' },
];

export const Leads: Leads[] = [
  { id: '1', title: 'Enterprise License Leads', value: 150000, stage: 'negotiation', probability: 75, contactId: '1', contactName: 'Sarah Johnson', companyId: '1', companyName: 'TechCorp Inc.', expectedCloseDate: '2024-12-30', createdAt: '2024-10-15', ownerName: 'John Smith', nextActivity: 'Review contract terms', priority: 'high', tags: ['Enterprise', 'SaaS'] },
  { id: '2', title: 'SaaS Implementation', value: 85000, stage: 'proposal', probability: 50, contactId: '2', contactName: 'Michael Chen', companyId: '2', companyName: 'Innovate.io', expectedCloseDate: '2025-01-15', createdAt: '2024-11-01', ownerName: 'Jane Doe', nextActivity: 'Schedule follow-up call', priority: 'medium', tags: ['Implementation', 'Cloud'] },
  { id: '3', title: 'Cloud Migration Project', value: 220000, stage: 'qualification', probability: 25, contactId: '3', contactName: 'Emily Rodriguez', companyId: '3', companyName: 'GlobalTech', expectedCloseDate: '2025-02-28', createdAt: '2024-11-20', ownerName: 'John Smith', nextActivity: 'Technical feasibility check', priority: 'high', tags: ['Migration', 'AWS'] },
  { id: '4', title: 'Annual Subscription Renewal', value: 45000, stage: 'closed-won', probability: 100, contactId: '4', contactName: 'David Kim', companyId: '4', companyName: 'StartupX', expectedCloseDate: '2024-11-30', createdAt: '2024-09-15', ownerName: 'Mike Johnson', nextActivity: 'Onboarding session', priority: 'low', tags: ['Renewal'] },
  { id: '5', title: 'Custom Integration Package', value: 95000, stage: 'proposal', probability: 60, contactId: '5', contactName: 'Lisa Thompson', companyId: '5', companyName: 'Enterprise Co', expectedCloseDate: '2025-01-30', createdAt: '2024-10-25', ownerName: 'Jane Doe', nextActivity: 'Send updated proposal', priority: 'medium', tags: ['Integration'] },
  { id: '6', title: 'Consulting Services', value: 35000, stage: 'negotiation', probability: 80, contactId: '6', contactName: 'James Wilson', companyId: '6', companyName: 'Solutions Net', expectedCloseDate: '2024-12-20', createdAt: '2024-11-05', ownerName: 'John Smith', nextActivity: 'Finalize SOW', priority: 'medium', tags: ['Consulting'] },
  { id: '7', title: 'Data Analytics Platform', value: 180000, stage: 'closed-won', probability: 100, contactId: '7', contactName: 'Amanda Foster', companyId: '7', companyName: 'BigData AI', expectedCloseDate: '2024-11-15', createdAt: '2024-08-20', ownerName: 'Mike Johnson', nextActivity: 'Implementation kickoff', priority: 'high', tags: ['Analytics', 'Big Data'] },
  { id: '8', title: 'Infrastructure Upgrade', value: 120000, stage: 'closed-lost', probability: 0, contactId: '8', contactName: 'Robert Martinez', companyId: '8', companyName: 'CloudServ', expectedCloseDate: '2024-10-30', createdAt: '2024-07-10', ownerName: 'Jane Doe', nextActivity: 'Churn analysis', priority: 'low', tags: ['Infrastructure'] },
];

export const companies: Company[] = [
  { id: '1', name: 'TechCorp Inc.', industry: 'Technology', size: '500-1000', revenue: '$50M-$100M', website: 'techcorp.com', phone: '+1 (555) 100-0001', address: '123 Tech Blvd, San Francisco, CA', contactCount: 5, LeadsCount: 3, totalValue: 350000 },
  { id: '2', name: 'Innovate.io', industry: 'Software', size: '100-500', revenue: '$10M-$50M', website: 'innovate.io', phone: '+1 (555) 100-0002', address: '456 Innovation Way, Austin, TX', contactCount: 3, LeadsCount: 2, totalValue: 185000 },
  { id: '3', name: 'GlobalTech', industry: 'IT Services', size: '1000+', revenue: '$100M+', website: 'globaltech.com', phone: '+1 (555) 100-0003', address: '789 Global Ave, New York, NY', contactCount: 8, LeadsCount: 4, totalValue: 520000 },
  { id: '4', name: 'StartupX', industry: 'FinTech', size: '10-50', revenue: '$1M-$10M', website: 'startupx.com', phone: '+1 (555) 100-0004', address: '321 Startup Lane, Seattle, WA', contactCount: 2, LeadsCount: 1, totalValue: 45000 },
  { id: '5', name: 'Enterprise Co', industry: 'Manufacturing', size: '1000+', revenue: '$100M+', website: 'enterprise.co', phone: '+1 (555) 100-0005', address: '555 Enterprise Dr, Chicago, IL', contactCount: 6, LeadsCount: 2, totalValue: 280000 },
  { id: '6', name: 'Solutions Net', industry: 'Consulting', size: '50-100', revenue: '$5M-$10M', website: 'solutions.net', phone: '+1 (555) 100-0006', address: '777 Solution St, Boston, MA', contactCount: 3, LeadsCount: 1, totalValue: 35000 },
];

export const tasks: Task[] = [
  { id: '1', title: 'Follow up on proposal', description: 'Send follow-up email regarding the enterprise license proposal', dueDate: '2024-12-09', priority: 'high', status: 'pending', assignee: 'John Smith', relatedTo: 'TechCorp Inc.', type: 'email' },
  { id: '2', title: 'Schedule demo call', description: 'Arrange product demo with the technical team', dueDate: '2024-12-10', priority: 'medium', status: 'pending', assignee: 'Jane Doe', relatedTo: 'Innovate.io', type: 'call' },
  { id: '3', title: 'Prepare contract', description: 'Draft contract for negotiation phase', dueDate: '2024-12-11', priority: 'high', status: 'in-progress', assignee: 'John Smith', relatedTo: 'GlobalTech', type: 'task' },
  { id: '4', title: 'Quarterly review meeting', description: 'Conduct quarterly business review with key stakeholders', dueDate: '2024-12-15', priority: 'medium', status: 'pending', assignee: 'Jane Doe', relatedTo: 'StartupX', type: 'meeting' },
  { id: '5', title: 'Update CRM data', description: 'Update contact information and Leads stages', dueDate: '2024-12-08', priority: 'low', status: 'completed', assignee: 'Mike Johnson', relatedTo: 'Enterprise Co', type: 'task' },
  { id: '6', title: 'Send pricing update', description: 'Email new pricing structure to potential client', dueDate: '2024-12-12', priority: 'medium', status: 'pending', assignee: 'John Smith', relatedTo: 'Solutions Net', type: 'email' },
];

export const activities: Activity[] = [
  { id: '1', type: 'call', title: 'Discovery call completed', description: 'Discussed requirements and budget with Sarah Johnson', timestamp: '2024-12-05T14:30:00', user: 'John Smith', relatedTo: 'TechCorp Inc.' },
  { id: '2', type: 'email', title: 'Proposal sent', description: 'Sent detailed proposal for SaaS implementation', timestamp: '2024-12-05T11:00:00', user: 'Jane Doe', relatedTo: 'Innovate.io' },
  { id: '3', type: 'meeting', title: 'Executive presentation', description: 'Presented solution to C-suite executives', timestamp: '2024-12-04T15:00:00', user: 'John Smith', relatedTo: 'GlobalTech' },
  { id: '4', type: 'Leads', title: 'Leads closed', description: 'Annual subscription renewed for $45,000', timestamp: '2024-12-03T16:45:00', user: 'Mike Johnson', relatedTo: 'StartupX' },
  { id: '5', type: 'note', title: 'Budget confirmed', description: 'Client confirmed Q1 2025 budget allocation', timestamp: '2024-12-03T10:15:00', user: 'Jane Doe', relatedTo: 'Enterprise Co' },
  { id: '6', type: 'email', title: 'Follow-up sent', description: 'Sent meeting summary and next steps', timestamp: '2024-12-02T09:30:00', user: 'John Smith', relatedTo: 'Solutions Net' },
];

export const dashboardStats = {
  totalRevenue: 930000,
  openLeads: 6,
  closedLeads: 2,
  newLeads: 15,
  conversionRate: 68,
  avgLeadsize: 116250,
  monthlyTarget: 500000,
  monthlyAchieved: 225000,
};

export const revenueData = [
  { month: 'Jan', revenue: 65000, Leads: 4 },
  { month: 'Feb', revenue: 78000, Leads: 5 },
  { month: 'Mar', revenue: 92000, Leads: 6 },
  { month: 'Apr', revenue: 85000, Leads: 5 },
  { month: 'May', revenue: 110000, Leads: 7 },
  { month: 'Jun', revenue: 125000, Leads: 8 },
  { month: 'Jul', revenue: 98000, Leads: 6 },
  { month: 'Aug', revenue: 180000, Leads: 9 },
  { month: 'Sep', revenue: 145000, Leads: 7 },
  { month: 'Oct', revenue: 165000, Leads: 8 },
  { month: 'Nov', revenue: 225000, Leads: 10 },
  { month: 'Dec', revenue: 190000, Leads: 8 },
];

export const targetVsAchieveData = revenueData.map(item => ({
  month: item.month,
  achieved: item.revenue,
  target: Math.round(item.revenue * (0.9 + Math.random() * 0.4)), // Target varies around revenue
}));

export const pipelineData = [
  { stage: 'Qualification', value: 220000, count: 1 },
  { stage: 'Proposal', value: 180000, count: 2 },
  { stage: 'Negotiation', value: 185000, count: 2 },
  { stage: 'Won', value: 450000, count: 4 },
  { stage: 'Lost', value: 120000, count: 1 },
];

export const customerData = [
  { stage: 'Signed Up', customers: 300 },
  { stage: 'Profile Completed', customers: 210 },
  { stage: 'First Interaction', customers: 150 },
  { stage: 'Repeat Users', customers: 80 },
  { stage: 'Inactive', customers: 40 },
];

export const leadScoring = [
  { name: 'Hot (90-100)', value: 45, color: '#EF4444' },
  { name: 'Warm (70-89)', value: 128, color: '#F59E0B' },
  { name: 'Neutral (50-69)', value: 285, color: '#3B82F6' },
  { name: 'Cool (30-49)', value: 412, color: '#0EA5E9' },
  { name: 'Cold (0-29)', value: 590, color: '#94A3B8' },
];


export const approvalRequests: ApprovalRequest[] = [
  { id: '1', LeadsTitle: 'Enterprise License Leads', LeadsValue: 150000, ownerName: 'John Smith', requestedDate: '2024-12-16', status: 'pending', type: 'discount', companyName: 'TechCorp Inc.', priority: 'high' },
  { id: '2', LeadsTitle: 'Cloud Migration Project', LeadsValue: 220000, ownerName: 'Jane Doe', requestedDate: '2024-12-17', status: 'pending', type: 'credit-terms', companyName: 'GlobalTech', priority: 'high' },
  { id: '3', LeadsTitle: 'Data Analytics Platform', LeadsValue: 180000, ownerName: 'Mike Johnson', requestedDate: '2024-12-15', status: 'pending', type: 'special-concession', companyName: 'BigData AI', priority: 'medium' },
  { id: '4', LeadsTitle: 'Infrastructure Upgrade', LeadsValue: 120000, ownerName: 'Jane Doe', requestedDate: '2024-12-18', status: 'pending', type: 'discount', companyName: 'CloudServ', priority: 'low' },
  { id: '5', LeadsTitle: 'Mobile App Development', LeadsValue: 45000, ownerName: 'John Smith', requestedDate: '2024-12-19', status: 'pending', type: 'special-concession', companyName: 'Innovate.io', priority: 'medium' },
  { id: '6', LeadsTitle: 'Annual Security Audit', LeadsValue: 35000, ownerName: 'Mike Johnson', requestedDate: '2024-12-20', status: 'pending', type: 'credit-terms', companyName: 'StartupX', priority: 'high' },
];
