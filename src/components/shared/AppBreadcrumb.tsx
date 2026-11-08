import { useLocation, Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/contacts': 'Customers',
  '/companies': 'Companies',
  '/products': 'Products',
  '/categories': 'Categories',
  '/tasks': 'Tasks',
  '/calendar': 'Calendar',
  '/ai-hub': 'AI Hub',
  '/sales-targets': 'Sales Targets',
  '/organization': 'Organization',
  '/automation': 'Automation',
  '/team': 'Team Management',
  '/admin': 'Admin',
  '/reports': 'Reports',
  '/leads-report': 'Leads Report',
  '/settings': 'Settings',
  '/sales-quotation': 'Sales & Quotation',
  '/forecast': 'Forecast',
};

// Helper to format dynamic segments or fallback
const formatSegment = (segment: string) => {
  // Check if it's an ID (simple check: includes numbers or is long mixed string)
  if (segment.length > 20 || /\d/.test(segment)) {
    return 'Details'; // Or keep it simple for now
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
};

export function AppBreadcrumb() {
  const location = useLocation();
  const from = location.state?.from;
  const pathSnippets = location.pathname.split('/').filter((i) => i);

  if (pathSnippets.length === 0) return null;

  const breadcrumbItems = [
    // {
    //   title: <Link to="/dashboard">Home</Link>,
    // },
    ...(from && routeNameMap[`/${from}`]
      ? [
        {
          title: <Link to={`/${from}`}>{routeNameMap[`/${from}`]}</Link>,
        },
        {
          title: <span className="text-blue-500">Details</span>,
        },
      ]
      : pathSnippets.map((_, index) => {
        const segment = pathSnippets[index];
        if (segment === 'edit' || segment === 'configuration' || segment === 'category') return null;

        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSnippets.length - 1;

        let title = routeNameMap[url];

        if (!title) {
          if (segment === 'add') title = 'New';
          else title = formatSegment(segment);
        }

        return {
          title: isLast ? (
            <span className="text-blue-500">{title}</span>
          ) : (
            <Link to={url}>{title}</Link>
          ),
        };
      }).filter(Boolean)),
  ];

  return (
    <div className="px-4 pt-1.5 text-[13px]">
      <Breadcrumb items={breadcrumbItems} />
    </div>
  );
}
