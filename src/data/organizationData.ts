export interface OrgMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  department: string;
  reportsTo: string | null;
  level: 'executive' | 'director' | 'manager' | 'individual';
}

export interface Target {
  id: string;
  name: string;
  level: 'organization' | 'region' | 'team' | 'individual';
  ownerId: string;
  ownerName: string;
  targetAmount: number;
  achievedAmount: number;
  period: string;
  parentId: string | null;
  children: string[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  type: 'approval' | 'escalation' | 'routing';
  trigger: string;
  conditions: string[];
  actions: string[];
  assignees: string[];
  isActive: boolean;
}

export const organizationMembers: OrgMember[] = [
  {
    id: 'exec-1',
    name: 'Sarah Chen',
    role: 'CEO',
    email: 'sarah.chen@company.com',
    avatar: 'SC',
    department: 'Executive',
    reportsTo: null,
    level: 'executive'
  },
  {
    id: 'exec-2',
    name: 'Michael Roberts',
    role: 'VP Sales',
    email: 'michael.roberts@company.com',
    avatar: 'MR',
    department: 'Sales',
    reportsTo: 'exec-1',
    level: 'executive'
  },
  {
    id: 'exec-3',
    name: 'Emily Davis',
    role: 'VP Marketing',
    email: 'emily.davis@company.com',
    avatar: 'ED',
    department: 'Marketing',
    reportsTo: 'exec-1',
    level: 'executive'
  },
  {
    id: 'dir-1',
    name: 'James Wilson',
    role: 'Sales Director - North',
    email: 'james.wilson@company.com',
    avatar: 'JW',
    department: 'Sales',
    reportsTo: 'exec-2',
    level: 'director'
  },
  {
    id: 'dir-2',
    name: 'Lisa Thompson',
    role: 'Sales Director - South',
    email: 'lisa.thompson@company.com',
    avatar: 'LT',
    department: 'Sales',
    reportsTo: 'exec-2',
    level: 'director'
  },
  {
    id: 'mgr-1',
    name: 'David Brown',
    role: 'Team Lead',
    email: 'david.brown@company.com',
    avatar: 'DB',
    department: 'Sales',
    reportsTo: 'dir-1',
    level: 'manager'
  },
  {
    id: 'mgr-2',
    name: 'Jennifer Lee',
    role: 'Team Lead',
    email: 'jennifer.lee@company.com',
    avatar: 'JL',
    department: 'Sales',
    reportsTo: 'dir-1',
    level: 'manager'
  },
  {
    id: 'mgr-3',
    name: 'Robert Martinez',
    role: 'Team Lead',
    email: 'robert.martinez@company.com',
    avatar: 'RM',
    department: 'Sales',
    reportsTo: 'dir-2',
    level: 'manager'
  },
  {
    id: 'ind-1',
    name: 'Alex Johnson',
    role: 'Sales Rep',
    email: 'alex.johnson@company.com',
    avatar: 'AJ',
    department: 'Sales',
    reportsTo: 'mgr-1',
    level: 'individual'
  },
  {
    id: 'ind-2',
    name: 'Maria Garcia',
    role: 'Sales Rep',
    email: 'maria.garcia@company.com',
    avatar: 'MG',
    department: 'Sales',
    reportsTo: 'mgr-1',
    level: 'individual'
  },
  {
    id: 'ind-3',
    name: 'Chris Taylor',
    role: 'Sales Rep',
    email: 'chris.taylor@company.com',
    avatar: 'CT',
    department: 'Sales',
    reportsTo: 'mgr-2',
    level: 'individual'
  },
  {
    id: 'ind-4',
    name: 'Amanda White',
    role: 'Sales Rep',
    email: 'amanda.white@company.com',
    avatar: 'AW',
    department: 'Sales',
    reportsTo: 'mgr-3',
    level: 'individual'
  }
];

export const salesTargets: Target[] = [
  {
    id: 'target-org',
    name: 'Organization Target Q4 2024',
    level: 'organization',
    ownerId: 'exec-1',
    ownerName: 'Sarah Chen',
    targetAmount: 5000000,
    achievedAmount: 3750000,
    period: 'Q4 2024',
    parentId: null,
    children: ['target-north', 'target-south']
  },
  {
    id: 'target-north',
    name: 'North Region',
    level: 'region',
    ownerId: 'dir-1',
    ownerName: 'James Wilson',
    targetAmount: 3000000,
    achievedAmount: 2400000,
    period: 'Q4 2024',
    parentId: 'target-org',
    children: ['target-team-1', 'target-team-2']
  },
  {
    id: 'target-south',
    name: 'South Region',
    level: 'region',
    ownerId: 'dir-2',
    ownerName: 'Lisa Thompson',
    targetAmount: 2000000,
    achievedAmount: 1350000,
    period: 'Q4 2024',
    parentId: 'target-org',
    children: ['target-team-3']
  },
  {
    id: 'target-team-1',
    name: 'Team Alpha',
    level: 'team',
    ownerId: 'mgr-1',
    ownerName: 'David Brown',
    targetAmount: 1500000,
    achievedAmount: 1200000,
    period: 'Q4 2024',
    parentId: 'target-north',
    children: ['target-alex', 'target-maria']
  },
  {
    id: 'target-team-2',
    name: 'Team Beta',
    level: 'team',
    ownerId: 'mgr-2',
    ownerName: 'Jennifer Lee',
    targetAmount: 1500000,
    achievedAmount: 1200000,
    period: 'Q4 2024',
    parentId: 'target-north',
    children: ['target-chris']
  },
  {
    id: 'target-team-3',
    name: 'Team Gamma',
    level: 'team',
    ownerId: 'mgr-3',
    ownerName: 'Robert Martinez',
    targetAmount: 2000000,
    achievedAmount: 1350000,
    period: 'Q4 2024',
    parentId: 'target-south',
    children: ['target-amanda']
  },
  {
    id: 'target-alex',
    name: 'Alex Johnson',
    level: 'individual',
    ownerId: 'ind-1',
    ownerName: 'Alex Johnson',
    targetAmount: 750000,
    achievedAmount: 620000,
    period: 'Q4 2024',
    parentId: 'target-team-1',
    children: []
  },
  {
    id: 'target-maria',
    name: 'Maria Garcia',
    level: 'individual',
    ownerId: 'ind-2',
    ownerName: 'Maria Garcia',
    targetAmount: 750000,
    achievedAmount: 580000,
    period: 'Q4 2024',
    parentId: 'target-team-1',
    children: []
  },
  {
    id: 'target-chris',
    name: 'Chris Taylor',
    level: 'individual',
    ownerId: 'ind-3',
    ownerName: 'Chris Taylor',
    targetAmount: 1500000,
    achievedAmount: 1200000,
    period: 'Q4 2024',
    parentId: 'target-team-2',
    children: []
  },
  {
    id: 'target-amanda',
    name: 'Amanda White',
    level: 'individual',
    ownerId: 'ind-4',
    ownerName: 'Amanda White',
    targetAmount: 2000000,
    achievedAmount: 1350000,
    period: 'Q4 2024',
    parentId: 'target-team-3',
    children: []
  }
];

export const workflowRules: WorkflowRule[] = [
  {
    id: 'wf-1',
    name: 'Large Leads Approval',
    type: 'approval',
    trigger: 'Leads value > $100,000',
    conditions: ['Leads stage = Proposal', 'Customer type = Enterprise'],
    actions: ['Notify VP Sales', 'Require approval before close'],
    assignees: ['exec-2'],
    isActive: true
  },
  {
    id: 'wf-2',
    name: 'Lead Escalation',
    type: 'escalation',
    trigger: 'Lead untouched for 24 hours',
    conditions: ['Lead status = New', 'Lead source = Website'],
    actions: ['Escalate to Team Lead', 'Send reminder email'],
    assignees: ['mgr-1', 'mgr-2', 'mgr-3'],
    isActive: true
  },
  {
    id: 'wf-3',
    name: 'Regional Lead Routing',
    type: 'routing',
    trigger: 'New lead created',
    conditions: ['Lead country specified'],
    actions: ['Route to regional director', 'Assign based on territory'],
    assignees: ['dir-1', 'dir-2'],
    isActive: true
  },
  {
    id: 'wf-4',
    name: 'Contract Review',
    type: 'approval',
    trigger: 'Contract uploaded',
    conditions: ['Leads stage = Negotiation', 'Contract value > $50,000'],
    actions: ['Legal review required', 'Notify sales manager'],
    assignees: ['mgr-1', 'mgr-2'],
    isActive: false
  }
];
