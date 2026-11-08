import { Header } from '@/components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, SlidersHorizontal, Users, UserCircle, Building2, Package, WarehouseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '../supabase/supabaseClient';
import { Lead } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PersistentToolbar } from '@/components/shared/PersistentToolbar';
import { Separator } from '@/components/ui/separator';
import { parseISO, isSameDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LeadsCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('Month');
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  // Filter states
  const [customerFilter, setCustomerFilter] = useState(true);
  const [salespersonFilter, setSalespersonFilter] = useState(true);
  const [customers, setCustomers] = useState({
    azureInterior: true,
    decoAddict: true,
    geminiFurniture: true,
    readyMat: true,
    undefined: true
  });
  const [salespersons, setSalespersons] = useState({
    mitchellAdmin: true
  });

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Leads are placed on their expected close date, falling back to the creation date
  const getLeadsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return leads.filter(lead => {
      const dateValue = lead.expected_close_date || lead.created_at;
      return dateValue ? isSameDay(parseISO(dateValue), targetDate) : false;
    });
  };

  const getEventsForDay = (day: number) => {
    return getLeadsForDay(day).map(lead => ({
      id: lead.id,
      title: lead.lead_name || lead.subject || lead.lead_number || 'Untitled lead',
      color: 'bg-orange-200',
    }));
  };

  const isToday = (day: number) => {
    return isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), new Date());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Leads Calendar"
        breadcrumbAction={
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-2 px-6 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/Leads/add')}>
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <PersistentToolbar
              currentPage={currentPage}
              totalItems={leads.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              currentView="calendar"
              showPagination={true}
              showViews={true}
            />
          </div>
        }
      />

      {/* Calendar Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={previousMonth} className="h-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth} className="h-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Month">Month</SelectItem>
              <SelectItem value="Week">Week</SelectItem>
              <SelectItem value="Day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8">
            Today
          </Button>
          <h2 className="text-lg font-semibold ml-4">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {dayNames.map((day, index) => (
            <div key={day} className={`p-2 text-center text-xs font-semibold text-muted-foreground border-r ${index === 6 ? 'border-r-0' : ''}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px] border-r border-b bg-muted/10" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day}
                className="min-h-[100px] border-r border-b p-1 hover:bg-muted/20 transition-colors"
              >
                <div className={`text-xs font-medium mb-1 ${isTodayDate ? 'bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-foreground'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1 py-0.5 rounded ${event.color} text-gray-800 truncate cursor-pointer hover:opacity-80`}
                      onClick={() => navigate(`/leads/${event.id}`)}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Sidebar Button */}
      {!showSidebar && (
        <Button
          variant="outline"
          size="sm"
          className="fixed right-4 top-24 z-50 h-10 w-10 p-0 rounded-full shadow-lg"
          onClick={() => setShowSidebar(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      )}

      {/* Right Sidebar */}
      {showSidebar && (
        <div className="fixed right-0 top-20 w-64 bg-card border-l p-4 h-[calc(100vh-80px)] overflow-y-auto">
          {/* Close Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSidebar(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mini Calendar */}
          <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={previousMonth}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={nextMonth}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px]">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-muted-foreground font-medium">{d}</div>
            ))}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`}></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <div
                  key={day}
                  className={`text-center py-0.5 rounded cursor-pointer hover:bg-muted ${isToday(day) ? 'bg-red-500 text-white' : ''}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-6">
          {/* Customer Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="customer-filter"
                checked={customerFilter}
                onCheckedChange={(checked) => setCustomerFilter(!!checked)}
                className="data-[state=checked]:bg-primary"
              />
              <label htmlFor="customer-filter" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Customer</span>
              </label>
            </div>
            <div className="ml-6 space-y-2.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="azure"
                  checked={customers.azureInterior}
                  onCheckedChange={(checked) => setCustomers({...customers, azureInterior: !!checked})}
                  className="data-[state=checked]:bg-primary"
                />
                <label htmlFor="azure" className="text-sm text-foreground cursor-pointer flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-blue-500" />
                  <span>Azure Interior</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="deco"
                  checked={customers.decoAddict}
                  onCheckedChange={(checked) => setCustomers({...customers, decoAddict: !!checked})}
                  className="data-[state=checked]:bg-primary"
                />
                <label htmlFor="deco" className="text-sm text-foreground cursor-pointer flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-amber-500" />
                  <span>Deco Addict</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gemini"
                  checked={customers.geminiFurniture}
                  onCheckedChange={(checked) => setCustomers({...customers, geminiFurniture: !!checked})}
                  className="data-[state=checked]:bg-primary"
                />
                <label htmlFor="gemini" className="text-sm text-foreground cursor-pointer flex items-center gap-1.5">
                  <WarehouseIcon className="h-3 w-3 text-cyan-500" />
                  <span>Gemini Furniture</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ready"
                  checked={customers.readyMat}
                  onCheckedChange={(checked) => setCustomers({...customers, readyMat: !!checked})}
                  className="data-[state=checked]:bg-primary"
                />
                <label htmlFor="ready" className="text-sm text-foreground cursor-pointer flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-gray-500" />
                  <span>Ready Mat</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="undefined"
                  checked={customers.undefined}
                  onCheckedChange={(checked) => setCustomers({...customers, undefined: !!checked})}
                  className="data-[state=checked]:bg-primary"
                />
                <label htmlFor="undefined" className="text-sm text-foreground cursor-pointer">
                  <span>Undefined</span>
                </label>
              </div>
            </div>
          </div>

          {/* Salesperson Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="salesperson-filter"
                checked={salespersonFilter}
                onCheckedChange={(checked) => setSalespersonFilter(!!checked)}
                className="data-[state=checked]:bg-primary"
              />
              <label htmlFor="salesperson-filter" className="text-sm font-medium cursor-pointer">
                Salesperson
              </label>
            </div>
            <div className="ml-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mitchell"
                  checked={salespersons.mitchellAdmin}
                  onCheckedChange={(checked) => setSalespersons({...salespersons, mitchellAdmin: !!checked})}
                  className="data-[state=checked]:bg-orange-500"
                />
                <label htmlFor="mitchell" className="text-sm text-foreground cursor-pointer">
                  Mitchell Admin
                </label>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
