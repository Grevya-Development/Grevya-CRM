// Sample drill-down data for dashboard and all pages

export const revenueDrillDown = {
  type: 'revenue' as const,
  title: 'Total Revenue',
  value: '$930K',
  breakdown: [
    {
      id: 'q4-2024',
      label: 'Q4 2024',
      value: 580000,
      subValue: '62.4% of total',
      trend: 'up' as const,
      trendValue: '+15.2%',
      children: [
        {
          id: 'oct-2024',
          label: 'October 2024',
          value: 165000,
          trend: 'up' as const,
          trendValue: '+8.5%',
          details: [
            { id: '1', name: 'Enterprise License Leads', value: 75000, contact: 'Sarah Johnson', company: 'TechCorp Inc.', date: '2024-10-15', status: 'won' },
            { id: '2', name: 'Cloud Migration Phase 1', value: 50000, contact: 'Michael Chen', company: 'Innovate.io', date: '2024-10-22', status: 'won' },
            { id: '3', name: 'Consulting Package', value: 40000, contact: 'Emily Rodriguez', company: 'GlobalTech', date: '2024-10-28', status: 'won' },
          ],
        },
        {
          id: 'nov-2024',
          label: 'November 2024',
          value: 225000,
          trend: 'up' as const,
          trendValue: '+22.3%',
          details: [
            { id: '4', name: 'Data Analytics Platform', value: 180000, contact: 'Amanda Foster', company: 'BigData AI', date: '2024-11-15', status: 'won' },
            { id: '5', name: 'Annual Subscription', value: 45000, contact: 'David Kim', company: 'StartupX', date: '2024-11-20', status: 'won' },
          ],
        },
        {
          id: 'dec-2024',
          label: 'December 2024',
          value: 190000,
          trend: 'neutral' as const,
          trendValue: 'In Progress',
          details: [
            { id: '6', name: 'Enterprise Upgrade', value: 150000, contact: 'Sarah Johnson', company: 'TechCorp Inc.', date: '2024-12-30', status: 'pending' },
            { id: '7', name: 'Consulting Services', value: 35000, contact: 'James Wilson', company: 'Solutions Net', date: '2024-12-20', status: 'pending' },
          ],
        },
      ],
    },
    {
      id: 'q3-2024',
      label: 'Q3 2024',
      value: 350000,
      subValue: '37.6% of total',
      trend: 'up' as const,
      trendValue: '+10.8%',
      children: [
        {
          id: 'jul-2024',
          label: 'July 2024',
          value: 98000,
          trend: 'down' as const,
          trendValue: '-5.2%',
          details: [
            { id: '8', name: 'Software License', value: 55000, contact: 'Lisa Thompson', company: 'Enterprise Co', date: '2024-07-10', status: 'won' },
            { id: '9', name: 'Support Contract', value: 43000, contact: 'Robert Martinez', company: 'CloudServ', date: '2024-07-18', status: 'won' },
          ],
        },
        {
          id: 'aug-2024',
          label: 'August 2024',
          value: 107000,
          trend: 'up' as const,
          trendValue: '+9.2%',
          details: [
            { id: '10', name: 'Integration Package', value: 65000, contact: 'Michael Chen', company: 'Innovate.io', date: '2024-08-05', status: 'won' },
            { id: '11', name: 'Training Services', value: 42000, contact: 'Emily Rodriguez', company: 'GlobalTech', date: '2024-08-22', status: 'won' },
          ],
        },
        {
          id: 'sep-2024',
          label: 'September 2024',
          value: 145000,
          trend: 'up' as const,
          trendValue: '+35.5%',
          details: [
            { id: '12', name: 'Enterprise Leads', value: 95000, contact: 'Sarah Johnson', company: 'TechCorp Inc.', date: '2024-09-12', status: 'won' },
            { id: '13', name: 'SaaS Subscription', value: 50000, contact: 'David Kim', company: 'StartupX', date: '2024-09-25', status: 'won' },
          ],
        },
      ],
    },
  ],
};

export const LeadsDrillDown = {
  type: 'Leads' as const,
  title: 'Open Leads',
  value: 6,
  breakdown: [
    {
      id: 'negotiation',
      label: 'Negotiation Stage',
      value: 185000,
      subValue: '2 Leads',
      trend: 'up' as const,
      trendValue: '77.5% avg probability',
      details: [
        { id: '1', name: 'Enterprise License Leads', value: 150000, contact: 'Sarah Johnson', company: 'TechCorp Inc.', date: '2024-12-30', status: 'negotiation' },
        { id: '2', name: 'Consulting Services', value: 35000, contact: 'James Wilson', company: 'Solutions Net', date: '2024-12-20', status: 'negotiation' },
      ],
    },
    {
      id: 'proposal',
      label: 'Proposal Stage',
      value: 180000,
      subValue: '2 Leads',
      trend: 'neutral' as const,
      trendValue: '55% avg probability',
      details: [
        { id: '3', name: 'SaaS Implementation', value: 85000, contact: 'Michael Chen', company: 'Innovate.io', date: '2025-01-15', status: 'proposal' },
        { id: '4', name: 'Custom Integration Package', value: 95000, contact: 'Lisa Thompson', company: 'Enterprise Co', date: '2025-01-30', status: 'proposal' },
      ],
    },
    {
      id: 'qualification',
      label: 'Qualification Stage',
      value: 220000,
      subValue: '1 Leads',
      trend: 'neutral' as const,
      trendValue: '25% probability',
      details: [
        { id: '5', name: 'Cloud Migration Project', value: 220000, contact: 'Emily Rodriguez', company: 'GlobalTech', date: '2025-02-28', status: 'qualification' },
      ],
    },
  ],
};

export const leadsDrillDown = {
  type: 'leads' as const,
  title: 'New Leads',
  value: 15,
  breakdown: [
    {
      id: 'hot',
      label: 'Hot Leads',
      value: 125000,
      subValue: '5 leads',
      trend: 'up' as const,
      trendValue: '+3 this week',
      details: [
        { id: '1', name: 'Enterprise Software Inquiry', value: 50000, contact: 'New Lead A', company: 'MegaCorp', date: '2024-12-08', status: 'hot' },
        { id: '2', name: 'Platform Demo Request', value: 35000, contact: 'New Lead B', company: 'TechStart', date: '2024-12-07', status: 'hot' },
        { id: '3', name: 'Consulting RFP', value: 25000, contact: 'New Lead C', company: 'ConsultPro', date: '2024-12-06', status: 'hot' },
        { id: '4', name: 'Integration Inquiry', value: 10000, contact: 'New Lead D', company: 'SmallBiz', date: '2024-12-05', status: 'hot' },
        { id: '5', name: 'Support Package', value: 5000, contact: 'New Lead E', company: 'LocalCo', date: '2024-12-05', status: 'hot' },
      ],
    },
    {
      id: 'warm',
      label: 'Warm Leads',
      value: 85000,
      subValue: '6 leads',
      trend: 'neutral' as const,
      trendValue: '+1 this week',
      details: [
        { id: '6', name: 'Website Inquiry', value: 20000, contact: 'Lead F', company: 'WebTech', date: '2024-12-04', status: 'warm' },
        { id: '7', name: 'Conference Contact', value: 18000, contact: 'Lead G', company: 'ConfCorp', date: '2024-12-03', status: 'warm' },
        { id: '8', name: 'Referral Lead', value: 15000, contact: 'Lead H', company: 'RefBiz', date: '2024-12-02', status: 'warm' },
        { id: '9', name: 'Inbound Call', value: 12000, contact: 'Lead I', company: 'CallCo', date: '2024-12-01', status: 'warm' },
        { id: '10', name: 'Email Campaign', value: 10000, contact: 'Lead J', company: 'EmailPro', date: '2024-11-30', status: 'warm' },
        { id: '11', name: 'Social Media', value: 10000, contact: 'Lead K', company: 'SocialBiz', date: '2024-11-29', status: 'warm' },
      ],
    },
    {
      id: 'cold',
      label: 'Cold Leads',
      value: 40000,
      subValue: '4 leads',
      trend: 'down' as const,
      trendValue: '-2 dropped',
      details: [
        { id: '12', name: 'Old Inquiry', value: 15000, contact: 'Lead L', company: 'OldCorp', date: '2024-11-15', status: 'cold' },
        { id: '13', name: 'Stale Contact', value: 10000, contact: 'Lead M', company: 'StaleCo', date: '2024-11-10', status: 'cold' },
        { id: '14', name: 'Unresponsive', value: 8000, contact: 'Lead N', company: 'NoReply', date: '2024-11-05', status: 'cold' },
        { id: '15', name: 'Follow-up Needed', value: 7000, contact: 'Lead O', company: 'FollowUp', date: '2024-10-28', status: 'cold' },
      ],
    },
  ],
};

export const conversionDrillDown = {
  type: 'conversion' as const,
  title: 'Conversion Rate',
  value: '68%',
  breakdown: [
    {
      id: 'by-source',
      label: 'By Lead Source',
      value: 68,
      subValue: 'Overall conversion',
      children: [
        {
          id: 'referral',
          label: 'Referrals',
          value: 85000,
          subValue: '82% conversion',
          trend: 'up' as const,
          trendValue: '+5%',
          details: [
            { id: '1', name: 'Partner Referral A', value: 45000, contact: 'Partner Lead 1', company: 'PartnerCo', date: '2024-12-01', status: 'won' },
            { id: '2', name: 'Customer Referral', value: 40000, contact: 'Customer Lead', company: 'CustomerBiz', date: '2024-11-28', status: 'won' },
          ],
        },
        {
          id: 'direct',
          label: 'Direct Contact',
          value: 120000,
          subValue: '71% conversion',
          trend: 'up' as const,
          trendValue: '+3%',
          details: [
            { id: '3', name: 'Cold Call Success', value: 65000, contact: 'Direct Lead A', company: 'DirectCorp', date: '2024-11-25', status: 'won' },
            { id: '4', name: 'Email Outreach', value: 55000, contact: 'Direct Lead B', company: 'OutreachCo', date: '2024-11-20', status: 'won' },
          ],
        },
        {
          id: 'inbound',
          label: 'Inbound Marketing',
          value: 95000,
          subValue: '58% conversion',
          trend: 'neutral' as const,
          trendValue: '0%',
          details: [
            { id: '5', name: 'Website Conversion', value: 50000, contact: 'Web Lead', company: 'WebCorp', date: '2024-11-18', status: 'won' },
            { id: '6', name: 'Content Download', value: 45000, contact: 'Content Lead', company: 'ContentBiz', date: '2024-11-15', status: 'won' },
          ],
        },
      ],
    },
    {
      id: 'by-industry',
      label: 'By Industry',
      value: 68,
      subValue: 'Overall conversion',
      children: [
        {
          id: 'tech',
          label: 'Technology',
          value: 180000,
          subValue: '75% conversion',
          trend: 'up' as const,
          trendValue: '+8%',
          details: [
            { id: '7', name: 'TechCorp Leads', value: 100000, contact: 'Sarah Johnson', company: 'TechCorp Inc.', date: '2024-11-10', status: 'won' },
            { id: '8', name: 'Innovate Leads', value: 80000, contact: 'Michael Chen', company: 'Innovate.io', date: '2024-11-05', status: 'won' },
          ],
        },
        {
          id: 'finance',
          label: 'Financial Services',
          value: 95000,
          subValue: '68% conversion',
          trend: 'neutral' as const,
          trendValue: '+1%',
          details: [
            { id: '9', name: 'FinTech Implementation', value: 55000, contact: 'Finance Lead', company: 'FinanceCorp', date: '2024-10-28', status: 'won' },
            { id: '10', name: 'Banking Platform', value: 40000, contact: 'Bank Lead', company: 'BankCo', date: '2024-10-22', status: 'won' },
          ],
        },
        {
          id: 'healthcare',
          label: 'Healthcare',
          value: 65000,
          subValue: '55% conversion',
          trend: 'down' as const,
          trendValue: '-3%',
          details: [
            { id: '11', name: 'Hospital System', value: 40000, contact: 'Health Lead', company: 'HealthCorp', date: '2024-10-15', status: 'won' },
            { id: '12', name: 'Clinic Software', value: 25000, contact: 'Clinic Lead', company: 'ClinicBiz', date: '2024-10-10', status: 'won' },
          ],
        },
      ],
    },
  ],
};

export const pipelineDrillDown = {
  type: 'pipeline' as const,
  title: 'Sales Pipeline',
  value: '$585K',
  breakdown: [
    {
      id: 'by-stage',
      label: 'By Pipeline Stage',
      value: 585000,
      subValue: 'Total pipeline value',
      children: [
        {
          id: 'qualification',
          label: 'Qualification',
          value: 220000,
          subValue: '1 Leads • 25% probability',
          trend: 'neutral' as const,
          trendValue: '$55K weighted',
          details: [
            { id: '1', name: 'Cloud Migration Project', value: 220000, contact: 'Emily Rodriguez', company: 'GlobalTech', date: '2025-02-28', status: 'qualification' },
          ],
        },
        {
          id: 'proposal',
          label: 'Proposal',
          value: 180000,
          subValue: '2 Leads • 55% avg probability',
          trend: 'up' as const,
          trendValue: '$99K weighted',
          details: [
            { id: '2', name: 'SaaS Implementation', value: 85000, contact: 'Michael Chen', company: 'Innovate.io', date: '2025-01-15', status: 'proposal' },
            { id: '3', name: 'Custom Integration', value: 95000, contact: 'Lisa Thompson', company: 'Enterprise Co', date: '2025-01-30', status: 'proposal' },
          ],
        },
        {
          id: 'negotiation',
          label: 'Negotiation',
          value: 185000,
          subValue: '2 Leads • 77.5% avg probability',
          trend: 'up' as const,
          trendValue: '$143K weighted',
          details: [
            { id: '4', name: 'Enterprise License Leads', value: 150000, contact: 'Sarah Johnson', company: 'TechCorp Inc.', date: '2024-12-30', status: 'negotiation' },
            { id: '5', name: 'Consulting Services', value: 35000, contact: 'James Wilson', company: 'Solutions Net', date: '2024-12-20', status: 'negotiation' },
          ],
        },
      ],
    },
    {
      id: 'by-owner',
      label: 'By Sales Rep',
      value: 585000,
      subValue: 'Total pipeline value',
      children: [
        {
          id: 'john-smith',
          label: 'John Smith',
          value: 370000,
          subValue: '3 Leads',
          trend: 'up' as const,
          trendValue: '+12% vs last month',
          details: [
            { id: '6', name: 'Enterprise License Leads', value: 150000, contact: 'Sarah Johnson', company: 'TechCorp Inc.', date: '2024-12-30', status: 'negotiation', assignee: 'John Smith' },
            { id: '7', name: 'Cloud Migration Project', value: 220000, contact: 'Emily Rodriguez', company: 'GlobalTech', date: '2025-02-28', status: 'qualification', assignee: 'John Smith' },
          ],
        },
        {
          id: 'jane-doe',
          label: 'Jane Doe',
          value: 180000,
          subValue: '2 Leads',
          trend: 'neutral' as const,
          trendValue: '+2% vs last month',
          details: [
            { id: '8', name: 'SaaS Implementation', value: 85000, contact: 'Michael Chen', company: 'Innovate.io', date: '2025-01-15', status: 'proposal', assignee: 'Jane Doe' },
            { id: '9', name: 'Custom Integration', value: 95000, contact: 'Lisa Thompson', company: 'Enterprise Co', date: '2025-01-30', status: 'proposal', assignee: 'Jane Doe' },
          ],
        },
        {
          id: 'mike-johnson',
          label: 'Mike Johnson',
          value: 35000,
          subValue: '1 Leads',
          trend: 'down' as const,
          trendValue: '-8% vs last month',
          details: [
            { id: '10', name: 'Consulting Services', value: 35000, contact: 'James Wilson', company: 'Solutions Net', date: '2024-12-20', status: 'negotiation', assignee: 'Mike Johnson' },
          ],
        },
      ],
    },
  ],
};
