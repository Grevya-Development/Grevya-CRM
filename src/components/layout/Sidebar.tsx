import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Settings,
  Mail,
  BarChart3,
  Bot,
  Target,
  Zap,
  UsersRound,
  FileText,
  Cog,
  ChevronDown,
  TrendingUp,
  Activity,
  ShoppingCart,
  PieChart,
  Sliders,
  Tag,
  XCircle,
  UserPlus,
  Building,
  CreditCard,
  Package,
} from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  icon: any;
  label: string;
  path: string;
  children?: { label: string; path: string; icon: any }[];
};

type MenuGroup = {
  label: string;
  icon?: any;
  items: NavItem[];
};

const topNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
  },
  { icon: FileText, label: 'My Leads', path: '/my-leads' },
  { icon: Mail, label: 'Inbox', path: '/incoming-emails' },
];

const menuGroups: MenuGroup[] = [
  {
    label: 'Sales',
    icon: ShoppingCart,
    items: [
      { icon: Users, label: 'Customer', path: '/contacts' },
      { icon: Briefcase, label: 'Leads', path: '/Leads' },
      { icon: Mail, label: 'Campaigns', path: '/campaigns' },
      // { icon: Package, label: 'Products', path: '/products' },
      { icon: FileText, label: 'Quotation', path: '/sales-quotation' },
      // { icon: ShoppingCart, label: 'Order', path: '/orders' },
      // { icon: FileText, label: 'Invoice', path: '/invoices' },
      // { icon: CreditCard, label: 'Payment', path: '/payments' },
      // { icon: Activity, label: 'My Activities', path: '/tasks' },
    ],
  },
  {
    label: 'Reporting',
    icon: PieChart,
    items: [
      { icon: FileText, label: 'Leads', path: '/leads-report' },
      { icon: BarChart3, label: 'Pipeline', path: '/pipeline-report' },
      { icon: TrendingUp, label: 'Forecast', path: '/forecast-report' },
      { icon: Activity, label: 'Activities', path: '/activities-report' },
      { icon: UsersRound, label: 'Teams', path: '/team' },
    ],
  },
  {
    label: 'Configuration',
    icon: Sliders,
    items: [
      { icon: TrendingUp, label: 'Forecast', path: '/forecast' },
      { icon: BarChart3, label: 'Pipeline', path: '/settings/pipeline' },
      { icon: Calendar, label: 'Activities', path: '/calendar' },
      { icon: Users, label: 'Sales Team', path: '/sales-teams' },
      { icon: Target, label: 'Sales Target', path: '/sales-targets' },
      { label: 'Email Templates', path: '/settings/email-templates', icon: FileText },

      { icon: Sliders, label: 'Masters', path: '/configuration/masters' },
    ],
  },
];

const settingsGroup: MenuGroup = {
  label: 'Settings',
  icon: Cog,
  items: [
    { label: 'User Settings', path: '/settings', icon: Settings },
    { label: 'Activity Types', path: '/settings/activity-types', icon: Activity },
    { label: 'Activity Plans', path: '/settings/activity-plans', icon: Calendar },
    { label: 'Tags', path: '/settings/tags', icon: Tag },
    { label: 'Lost Reasons', path: '/settings/lost-reasons', icon: XCircle },
    { label: 'Lead Mining Requests', path: '/settings/lead-mining', icon: Target },
  ],
};

const separateNavItems: NavItem[] = [
  { icon: Bot, label: 'AI Hub', path: '/ai-hub' },
  { icon: Zap, label: 'Automation', path: '/automation' },
];

interface SidebarProps {
  isExpanded: boolean;
  onHoverChange: (isExpanded: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isExpanded, onHoverChange, isMobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Sidebar should show full content if it's expanded on desktop OR opened on mobile
  const showFull = isExpanded || isMobileOpen;

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label)
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-[width] duration-300 transition-premium overflow-hidden md:translate-x-0 will-change-[width]',
        !showFull ? 'w-14' : 'w-64',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:block'
      )}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-12 items-center border-b border-sidebar-border px-3 overflow-hidden">
          <div className="flex items-center gap-2 min-w-max">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-sidebar-border shadow-sm">
              <img src="/grevya-icon.png" alt="Grevya CRM Logo" className="h-full w-full object-contain p-0.5" />
            </div>
            <span className={cn(
              "text-base font-semibold text-sidebar-foreground whitespace-nowrap transition-all duration-300 ease-in-out",
              showFull ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
            )}>
              Grevya CRM
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
          <div className="space-y-1">
            {/* Top Nav Items - Always visible at top */}
            {topNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    !showFull && 'justify-center',
                    isActive && showFull
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  "whitespace-nowrap transition-all duration-300 ease-in-out",
                  showFull ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
                )}>
                  {item.label}
                </span>
              </NavLink>
            ))}

            {/* Separator */}
            <div className="my-2 h-px bg-sidebar-border" />

            {/* Menu Groups - Expandable */}
            {menuGroups.map((group) => (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm transition-all hover:bg-sidebar-accent rounded-lg text-sidebar-foreground",
                    !showFull && "justify-center"
                  )}
                >
                  {group.icon && <group.icon className="h-4 w-4 flex-shrink-0" />}
                  <div className={cn(
                    "flex flex-1 items-center justify-between transition-all duration-300 ease-in-out",
                    showFull ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
                  )}>
                    <span className="font-medium flex-1 text-left whitespace-nowrap">{group.label}</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      expandedGroups.includes(group.label) && "rotate-180"
                    )} />
                  </div>
                </button>
                <div className={cn(
                  "sidebar-content-height overflow-hidden transition-premium",
                  (showFull && expandedGroups.includes(group.label)) && "expanded"
                )}>
                  <div className="min-h-0">
                    <div className="ml-4 mt-1 space-y-0.5 pb-2">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => onCloseMobile?.()}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                              'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                              isActive && showFull
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                : 'text-sidebar-foreground'
                            )
                          }
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className={cn(
                            "whitespace-nowrap transition-all duration-300 transition-premium",
                            showFull ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
                          )}>
                            {item.label}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Separator */}
            <div className="my-3 h-px bg-sidebar-border" />

            {/* Separate Nav Items */}
            <div className="space-y-0.5">
              {separateNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onCloseMobile?.()}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                      'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                      !showFull && 'justify-center',
                      isActive && showFull
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300 ease-in-out",
                    showFull ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
                  )}>
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>

            {/* Settings Group - Expandable */}
            <div>
              <button
                onClick={() => toggleGroup(settingsGroup.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm transition-all hover:bg-sidebar-accent rounded-lg text-sidebar-foreground",
                  !showFull && "justify-center"
                )}
              >
                {settingsGroup.icon && <settingsGroup.icon className="h-4 w-4 flex-shrink-0" />}
                <div className={cn(
                  "flex flex-1 items-center justify-between transition-all duration-300 ease-in-out",
                  showFull ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
                )}>
                  <span className="font-medium flex-1 text-left whitespace-nowrap">{settingsGroup.label}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    expandedGroups.includes(settingsGroup.label) && "rotate-180"
                  )} />
                </div>
              </button>
              <div className={cn(
                "sidebar-content-height overflow-hidden transition-premium",
                (showFull && expandedGroups.includes(settingsGroup.label)) && "expanded"
              )}>
                <div className="min-h-0">
                  <div className="ml-4 mt-1 space-y-0.5 pb-2">
                    {settingsGroup.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => onCloseMobile?.()}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                            'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                            isActive && showFull
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-sidebar-foreground'
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className={cn(
                          "whitespace-nowrap transition-all duration-300 transition-premium",
                          showFull ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
                        )}>
                          {item.label}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div >
    </aside >
  );
}
