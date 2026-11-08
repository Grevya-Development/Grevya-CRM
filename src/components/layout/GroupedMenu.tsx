import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Settings as SettingsIcon } from 'lucide-react';
import {
  LayoutGrid,
  Activity,
  BarChart3,
  Users,
  Tag,
  TrendingUp,
  FileText,
  Target,
  Settings,
  UserCog,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon?: any;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

// Define menu groups based on the screenshots
const menuGroups: MenuGroup[] = [
  {
    label: 'View',
    items: [
      { label: 'My Pipeline', path: '/Leads', icon: LayoutGrid },
      { label: 'My Activities', path: '/Leads/activity', icon: Activity },
      { label: 'Teams', path: '/team', icon: Users },
      { label: 'Customers', path: '/companies', icon: Users },
    ],
  },
  {
    label: 'New',
    items: [
      { label: 'Forecast', path: '/forecast', icon: TrendingUp },
      { label: 'Pipeline', path: '/Leads/pipeline', icon: BarChart3 },
      { label: 'Leads', path: '/Leads/add', icon: FileText },
      { label: 'Activities', path: '/tasks', icon: CalendarIcon },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { label: 'Forecast', path: '/reports/forecast', icon: TrendingUp },
      { label: 'Pipeline', path: '/reports/pipeline', icon: BarChart3 },
      { label: 'Leads', path: '/reports/leads', icon: FileText },
      { label: 'Activities', path: '/reports/activities', icon: Activity },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'Sales Teams', path: '/settings/sales-teams', icon: Users },
      { label: 'Activity Types', path: '/settings/activity-types', icon: Activity },
      { label: 'Activity Plans', path: '/settings/activity-plans', icon: CalendarIcon },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { label: 'Tags', path: '/pipeline/tags', icon: Tag },
      { label: 'Lost Reasons', path: '/pipeline/lost-reasons', icon: FileText },
    ],
  },
  {
    label: 'Lead Generation',
    items: [
      { label: 'Lead Mining Requests', path: '/lead-mining', icon: Target },
    ],
  },
];

interface GroupedMenuProps {
  triggerLabel?: string;
  variant?: 'default' | 'compact';
}

export function GroupedMenu({ triggerLabel = 'Generate Leads', variant = 'default' }: GroupedMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleItemClick = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'compact' ? 'ghost' : 'default'}
          size="sm"
          className="gap-2"
        >
          {triggerLabel}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
              {group.label}
            </DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className="cursor-pointer"
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Variant specifically for the top navigation bar
export function TopNavGroupedMenu() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const topMenuGroups = [
    {
      label: 'My Pipeline',
      path: '/Leads',
      subItems: [
        { label: 'My Pipeline', path: '/Leads' },
        { label: 'My Activities', path: '/Leads/activity' },
        { label: 'Teams', path: '/team' },
        { label: 'Customers', path: '/companies' },
        { label: 'Quotations', path: '/sales-quotation' },
        { label: 'Order', path: '/orders' },
      ],
    },
    {
      label: 'Generate Leads',
      path: '#',
      subItems: [
        { label: 'Forecast', path: '/forecast' },
        { label: 'Pipeline', path: '/Leads/pipeline' },
        { label: 'Leads', path: '/Leads/add' },
        { label: 'Activities', path: '/tasks' },
      ],
    },
    {
      label: 'Pipeline',
      path: '#',
      subItems: [
        { label: 'Settings', path: '/settings' },
        { label: 'Sales Teams', path: '/settings/sales-teams' },
        { label: 'Activity Types', path: '/settings/activity-types' },
        { label: 'Activity Plans', path: '/settings/activity-plans' },
        { label: 'Tags', path: '/pipeline/tags' },
        { label: 'Lost Reasons', path: '/pipeline/lost-reasons' },
        { label: 'Lead Mining Requests', path: '/lead-mining' },
      ],
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {topMenuGroups.map((menu) => (
        <DropdownMenu
          key={menu.label}
          onOpenChange={(open) => setActiveMenu(open ? menu.label : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant={activeMenu === menu.label ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1 h-9"
            >
              {menu.label}
              {menu.subItems && <ChevronDown className="h-3 w-3" />}
            </Button>
          </DropdownMenuTrigger>
          {menu.subItems && (
            <DropdownMenuContent align="start" className="w-52">
              {menu.subItems.map((item) => (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="cursor-pointer"
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      ))}
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
        <SettingsIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
