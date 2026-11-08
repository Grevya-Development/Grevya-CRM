import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Calendar, Table2, BarChart2, Clock, BarChart3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PersistentToolbarProps {
  // Pagination props
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onDrilldownClick?: () => void;


  // View props
  currentView?: 'pipeline' | 'list' | 'calendar' | 'pivot' | 'graph' | 'activity';
  onViewChange?: (view: 'pipeline' | 'list' | 'calendar' | 'pivot' | 'graph' | 'activity') => void;

  // Optional: Hide pagination or views if not needed
  showPagination?: boolean;
  showPageCount?: boolean;
  showViews?: boolean;
  isDrilldown?: boolean;

  // Custom actions slot
  actions?: React.ReactNode;
}

export const PersistentToolbar = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  currentView = 'pipeline',
  onViewChange,
  showPagination = true,
  showPageCount = true,
  showViews = true,
  actions,
  onDrilldownClick,
  isDrilldown = false,
}: PersistentToolbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect active view from URL
  const getActiveViewFromUrl = (): 'pipeline' | 'list' | 'calendar' | 'pivot' | 'graph' | 'activity' => {
    const pathname = location.pathname.toLowerCase();
    if (pathname.includes('/calendar')) return 'calendar';
    if (pathname.includes('/pivot')) return 'pivot';
    if (pathname.includes('/graph')) return 'graph';
    if (pathname.includes('/activity')) return 'activity';
    // If currentView is explicitly set to 'list', use it, otherwise default to 'pipeline'
    return currentView;
  };

  const activeView = getActiveViewFromUrl();

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const handleViewChange = (view: 'pipeline' | 'list' | 'calendar' | 'pivot' | 'graph' | 'activity') => {
    if (onViewChange) {
      onViewChange(view);
    }

    // Navigate to different pages based on view
    const basePath = location.pathname.split('/')[1]; // Get base path (e.g., 'Leads')
    if (view === 'calendar') {
      navigate(`/${basePath}/calendar`);
    } else if (view === 'pivot') {
      navigate(`/${basePath}/pivot`);
    } else if (view === 'graph') {
      navigate(`/${basePath}/graph`);
    } else if (view === 'activity') {
      navigate(`/${basePath}/activity`);
    } else if (view === 'pipeline' || view === 'list') {
      navigate(`/${basePath}`);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0 text-foreground flex-wrap">
      {/* Custom actions slot */}
      {actions}
      {actions && (showPagination || showViews) && (
        <Separator orientation="vertical" className="h-6 mx-2" />
      )}

      {/* Pagination Info */}
      {showPagination && (
        <>
          {showPageCount && (
            <div className="text-sm text-muted-foreground px-3">
              {startIndex + 1}-{endIndex} / {totalItems}
            </div>
          )}

          {/* Pagination Arrows */}
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </>
      )}

      {/* View Toggle Buttons */}
      {showViews && (
        <TooltipProvider>
          <div className="flex items-center border rounded-md overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={!isDrilldown && activeView === 'pipeline' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-10 p-0 rounded-none border-r"
                  onClick={() => handleViewChange('pipeline')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pipeline View</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={!isDrilldown && activeView === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-10 p-0 rounded-none border-r"
                  onClick={() => handleViewChange('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>List View</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isDrilldown ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-10 p-0 rounded-none border-r"
                  onClick={onDrilldownClick}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pipeline Drilldown</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
};
