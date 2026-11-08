import {
  Trash2,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Download,
  Plus,
  Search,
  Mail,
  MoreVertical,
  Edit,
  Filter,
  Layers,
  X,
  PlusCircle,
  Settings2,
  ChevronRight,
  User,
  Flag,
  CalendarDays,
  Table2,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase/supabaseClient';
import { Lead } from '@/types';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { ColumnManager } from '@/components/contacts/ColumnManager';
import { ColumnDefinition } from '@/services/userSettings';
import { useSearchParams } from 'react-router-dom';
import { PermissionActions, usePermission } from '@/contexts/PermissionContext';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

interface LeadsListViewProps {
  leads: Lead[];
  allLeads: Lead[];
  sortConfig: { key: keyof Lead; direction: 'asc' | 'desc' } | null;
  onSort: (key: keyof Lead) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const LeadsListView = ({
  leads,
  allLeads,
  sortConfig,
  onSort,
  searchTerm,
  onSearchChange
}: LeadsListViewProps) => {
  const { canCreate, hasPermission } = usePermission();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  // Initial Columns State
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { id: 'lead_number', label: 'ID', visible: true },
    { id: 'lead_name', label: 'Opportunity', visible: true },
    { id: 'customer_id', label: 'Customer', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'lead_owner_id', label: 'Salesperson', visible: true },
    { id: 'estimated_deal_value', label: 'Estimated Deal Value', visible: true },
    { id: 'lead_stage', label: 'Stage', visible: true },
    { id: 'lead_priority', label: 'Priority', visible: true },
    { id: 'lost_reason', label: 'Lost Reason', visible: true },
  ]);

  // Advanced Filtering State
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [customFilters, setCustomFilters] = useState<{
    minDealValue?: number;
    maxDealValue?: number;
    fromDate?: Date;
    toDate?: Date;
    closingFromDate?: Date;
    closingToDate?: Date;
  }>({});
  const [groupBy, setGroupBy] = useState<string>('none');

  // Available options for filters
  const filterOptions = useMemo(() => {
    const stages = Array.from(new Set(allLeads.map(l => l.lead_stage || 'Unknown'))).sort();
    const owners = Array.from(new Set(allLeads.map(l => l.lead_owner?.full_name || 'Unassigned'))).sort();
    const priorities = Array.from(new Set(allLeads.map(l => l.lead_priority || 'No Priority'))).sort();
    return { stages, owners, priorities };
  }, [allLeads]);

  // Core Filtering Logic
  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      // 1. Search Term
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        lead.lead_name?.toLowerCase().includes(lowerSearch) ||
        lead.email?.toLowerCase().includes(lowerSearch) ||
        lead.lead_owner?.full_name?.toLowerCase().includes(lowerSearch) ||
        lead.lead_source?.toLowerCase().includes(lowerSearch);

      if (!matchesSearch) return false;

      // 2. Active Filters (Multi-select)
      for (const [key, values] of Object.entries(activeFilters)) {
        if (!values.length) continue;

        let leadValue = '';
        if (key === 'lead_stage') leadValue = lead.lead_stage || 'Unknown';
        else if (key === 'lead_owner') leadValue = lead.lead_owner?.full_name || 'Unassigned';
        else if (key === 'lead_priority') leadValue = lead.lead_priority || 'No Priority';

        if (!values.includes(leadValue)) return false;
      }

      // 3. Custom Filters (Ranges)
      if (customFilters.minDealValue !== undefined && Number(lead.estimated_deal_value || 0) < customFilters.minDealValue) return false;
      if (customFilters.maxDealValue !== undefined && Number(lead.estimated_deal_value || 0) > customFilters.maxDealValue) return false;

      if (customFilters.fromDate && lead.created_at && new Date(lead.created_at) < customFilters.fromDate) return false;
      if (customFilters.toDate && lead.created_at && new Date(lead.created_at) > customFilters.toDate) return false;

      // 4. Closing Date Range
      if (lead.expected_close_date) {
        const leadDate = new Date(lead.expected_close_date);
        if (customFilters.closingFromDate && leadDate < customFilters.closingFromDate) return false;
        if (customFilters.closingToDate && leadDate > customFilters.closingToDate) return false;
      } else if (customFilters.closingFromDate || customFilters.closingToDate) {
        return false;
      }

      return true;
    });
  }, [allLeads, searchTerm, activeFilters, customFilters]);

  // Sorting Logic
  const sortedLeads = useMemo(() => {
    if (!sortConfig) return filteredLeads;

    return [...filteredLeads].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortConfig]);

  // Grouping Logic
  const groupedLeads = useMemo(() => {
    if (groupBy === 'none') return { 'All Leads': sortedLeads };

    return sortedLeads.reduce((acc, lead) => {
      let groupKey = 'Unknown';
      if (groupBy === 'lead_stage') groupKey = lead.lead_stage || 'Unknown';
      else if (groupBy === 'lead_owner_id') groupKey = lead.lead_owner?.full_name || 'Unassigned';
      else if (groupBy === 'lead_priority') groupKey = lead.lead_priority || 'No Priority';

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(lead);
      return acc;
    }, {} as Record<string, Lead[]>);
  }, [sortedLeads, groupBy]);

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setCustomFilters({});
    onSearchChange('');
  };

  const removeFilterValue = (category: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(v => v !== value)
    }));
  };

  const visibleCols = columns.filter(c => c.visible);

  const [searchParams] = useSearchParams();
  const stageFilter = searchParams.get("lead_stage");
  const sourceFilter = searchParams.get("lead_source");

  const filterleads = leads.filter((lead) => {
    if (stageFilter && lead.lead_stage !== stageFilter) return false;
    if (sourceFilter && lead.lead_source !== sourceFilter) return false;
    return true;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Qualification': return 'bg-primary/10 text-primary hover:bg-primary/20';
      case 'Won': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
      case 'Lost': return 'bg-rose-100 text-rose-700 hover:bg-rose-200';
      default: return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
    }
  };

  // Helper to check if a column is sortable
  const isSortable = (id: string) => {
    return ['lead_name', 'email', 'lead_owner_id', 'estimated_deal_value', 'lead_stage'].includes(id);
  };

  // Dynamic Cell Rendering
  const renderCell = (lead: Lead, columnId: string) => {
    switch (columnId) {
      case 'lead_name':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {lead.lead_name}
            </span>
          </div>
        );
      case 'customer_id':
        const customer = (lead as any).customers;
        return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
      case 'email':
        return <span className="text-muted-foreground">{lead.email}</span>;
      case 'lead_owner_id':
        const ownerName = lead.lead_owner?.full_name || 'Unassigned';
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {ownerName.charAt(0)}
            </div>
            <span className="text-sm">{ownerName}</span>
          </div>
        );
      case 'estimated_deal_value':
        return (
          <span className="font-medium tabular-nums">
            {formatCurrency(Number(lead.estimated_deal_value || 0))}
          </span>
        );
      case 'lead_stage':
        return (
          <Badge variant="secondary" className={`font-normal ${getStageColor(lead.lead_stage || '')}`}>
            {lead.lead_stage}
          </Badge>
        );
      case 'lost_reason':
        return (
          <span className="text-sm text-destructive font-medium italic">
            {lead.lost_reason || '-'}
          </span>
        );
      default:
        return lead[columnId as keyof Lead] || (lead as any).custom_fields?.[columnId] || '-';
    }
  };

  // Export Logic
  const handleExport = (format: 'csv' | 'excel') => {
    const leadsToExport = allLeads;

    if (leadsToExport.length === 0) {
      toast.error('No leads to export');
      return;
    }

    const headers = visibleCols.map(c => c.label);

    const getExportValue = (lead: Lead, columnId: string) => {
      switch (columnId) {
        case 'customer_id':
          const customer = (lead as any).customers;
          return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
        case 'estimated_deal_value':
          return Number(lead.estimated_deal_value || 0);
        default:
          return (lead as any)[columnId] || (lead as any).custom_fields?.[columnId] || '';
      }
    };

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...leadsToExport.map(l =>
          visibleCols.map(c => {
            const val = getExportValue(l, c.id);
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // Excel Export (simple .xls compatible)
      const excelContent = [
        headers.join('\t'),
        ...leadsToExport.map(l =>
          visibleCols.map(c => {
            const val = getExportValue(l, c.id);
            return String(val);
          }).join('\t')
        )
      ].join('\n');

      const blob = new Blob([excelContent], {
        type: 'application/vnd.ms-excel;charset=utf-8;'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    toast.success(`Exported ${leadsToExport.length} leads as ${format.toUpperCase()}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-96">
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-4 pr-10 rounded-md border-slate-200 focus-visible:ring-blue-500 bg-white h-10"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 w-44 border-slate-200 transition-all gap-2 px-3 justify-start shrink-0",
                  Object.values(activeFilters).some(v => v.length > 0)
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "hover:border-blue-600 hover:text-blue-600"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {Object.values(activeFilters).flat().length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-100 text-blue-700 border-none">
                    {Object.values(activeFilters).flat().length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl" align="start">
              <div className="p-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Advanced Filters</h4>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-[11px] text-blue-600 hover:text-blue-700 px-2">
                    Clear All
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[450px]">
                <div className="p-4 space-y-6">
                  {/* Stages */}
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sales Stage</Label>
                    <div className="space-y-2">
                      {filterOptions.stages.map(stage => (
                        <div key={stage} className="flex items-center space-x-2">
                          <Checkbox
                            id={`stage-${stage}`}
                            checked={activeFilters.lead_stage?.includes(stage)}
                            onCheckedChange={() => toggleFilter('lead_stage', stage)}
                          />
                          <label htmlFor={`stage-${stage}`} className="text-sm font-medium leading-none cursor-pointer">
                            {stage}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Owners */}
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Salesperson</Label>
                    <div className="space-y-2">
                      {filterOptions.owners.map(owner => (
                        <div key={owner} className="flex items-center space-x-2">
                          <Checkbox
                            id={`owner-${owner}`}
                            checked={activeFilters.lead_owner?.includes(owner)}
                            onCheckedChange={() => toggleFilter('lead_owner', owner)}
                          />
                          <label htmlFor={`owner-${owner}`} className="text-sm font-medium leading-none cursor-pointer">
                            {owner}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Priority */}
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Priority</Label>
                    <div className="space-y-2">
                      {filterOptions.priorities.map(p => (
                        <div key={p} className="flex items-center space-x-2">
                          <Checkbox
                            id={`prio-${p}`}
                            checked={activeFilters.lead_priority?.includes(p)}
                            onCheckedChange={() => toggleFilter('lead_priority', p)}
                          />
                          <label htmlFor={`prio-${p}`} className="text-sm font-medium leading-none cursor-pointer">
                            {p || 'Normal'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />

                  {/* Custom Filters Section */}
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                      <Settings2 className="h-3 w-3" />
                      Custom Ranges
                    </Label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Deal Value Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            className="h-8 text-xs"
                            value={customFilters.minDealValue || ''}
                            onChange={(e) => setCustomFilters(prev => ({ ...prev, minDealValue: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            className="h-8 text-xs"
                            value={customFilters.maxDealValue || ''}
                            onChange={(e) => setCustomFilters(prev => ({ ...prev, maxDealValue: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Creation Date</Label>
                        <div className="grid grid-cols-1 gap-4">
                          <DatePicker
                            label="From Date"
                            date={customFilters.fromDate}
                            setDate={(date) => setCustomFilters(prev => ({ ...prev, fromDate: date }))}
                          />
                          <DatePicker
                            label="To Date"
                            date={customFilters.toDate}
                            setDate={(date) => setCustomFilters(prev => ({ ...prev, toDate: date }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Closing Date</Label>
                        <div className="grid grid-cols-1 gap-4">
                          <DatePicker
                            label="From Date"
                            date={customFilters.closingFromDate}
                            setDate={(date) => setCustomFilters(prev => ({ ...prev, closingFromDate: date }))}
                          />
                          <DatePicker
                            label="To Date"
                            date={customFilters.closingToDate}
                            setDate={(date) => setCustomFilters(prev => ({ ...prev, closingToDate: date }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="flex items-center w-44 border border-slate-200 rounded-md bg-white px-2 h-10 transition-all hover:border-blue-600 group/groupby shrink-0">
            <Layers className="h-4 w-4 text-slate-400 mr-2 group-hover/groupby:text-blue-600 transition-colors" />
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="h-9 w-full border-none shadow-none focus:ring-0 text-xs font-semibold group-hover/groupby:text-blue-600 transition-colors px-0">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="lead_stage">By Stage</SelectItem>
                <SelectItem value="lead_owner_id">By Salesperson</SelectItem>
                <SelectItem value="lead_priority">By Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      <div className="flex items-center gap-2 shrink-0">
          {canCreate("leads") && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-10 w-10 p-0 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                    onClick={() => navigate('/Leads/add')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Lead</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-10 p-0 border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Export Options</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Export Data</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer gap-2">
                <Table2 className="h-4 w-4 text-slate-500" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer gap-2">
                <Table2 className="h-4 w-4 text-slate-500" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          <ColumnManager
            columns={columns}
            onColumnsChange={setColumns}
            triggerClassName="h-10 w-10 p-0 border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {(Object.values(activeFilters).some(v => v.length > 0) || Object.values(customFilters).some(v => v !== undefined)) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Active Filters:</span>
          {Object.entries(activeFilters).map(([category, values]) => (
            values.map(val => (
              <Badge
                key={`${category}-${val}`}
                variant="secondary"
                className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-white border border-slate-200 text-slate-700 animate-in fade-in zoom-in duration-200"
              >
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">{category.replace('lead_', '')}:</span>
                {val}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full hover:bg-slate-100 p-0 ml-1"
                  onClick={() => removeFilterValue(category, val)}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            ))
          ))}

          {customFilters.minDealValue !== undefined && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-white border border-slate-200 text-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">Min Value:</span>
              {formatCurrency(customFilters.minDealValue)}
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0 ml-1" onClick={() => setCustomFilters(prev => ({ ...prev, minDealValue: undefined }))}>
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          )}
          {customFilters.maxDealValue !== undefined && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-white border border-slate-200 text-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">Max Value:</span>
              {formatCurrency(customFilters.maxDealValue)}
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0 ml-1" onClick={() => setCustomFilters(prev => ({ ...prev, maxDealValue: undefined }))}>
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          )}
          {(customFilters.fromDate || customFilters.toDate) && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-white border border-slate-200 text-slate-700 font-medium tracking-tight">
              <CalendarDays className="h-3 w-3 text-slate-400 mr-1" />
              {customFilters.fromDate ? format(customFilters.fromDate, 'MMM d, yyyy') : '...'} to {customFilters.toDate ? format(customFilters.toDate, 'MMM d, yyyy') : '...'}
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0 ml-1" onClick={() => setCustomFilters(prev => ({ ...prev, fromDate: undefined, toDate: undefined }))}>
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          )}
          {(customFilters.closingFromDate || customFilters.closingToDate) && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-white border border-slate-200 text-slate-700 font-medium tracking-tight">
              <CalendarDays className="h-3 w-3 text-slate-400 mr-1" />
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">Closing:</span>
              {customFilters.closingFromDate ? format(customFilters.closingFromDate, 'MMM d, yyyy') : '...'} to {customFilters.closingToDate ? format(customFilters.closingToDate, 'MMM d, yyyy') : '...'}
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0 ml-1" onClick={() => setCustomFilters(prev => ({ ...prev, closingFromDate: undefined, closingToDate: undefined }))}>
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-[10px] text-muted-foreground hover:text-blue-600 transition-colors underline underline-offset-4">
            Reset All
          </Button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden text-slate-900 border-slate-200">
        <Table>
          <TableHeader className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-20 border-b">
            <TableRow>
              {visibleCols.map((col) => {
                const sortable = isSortable(col.id);
                return (
                  <TableHead
                    key={col.id}
                    className={sortable ? "cursor-pointer hover:bg-muted/80 transition-colors" : ""}
                    onClick={() => sortable && onSort(col.id as keyof Lead)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortConfig?.key === col.id && (
                        sortConfig.direction === 'asc'
                          ? <ChevronUp className="h-3 w-3 text-blue-600" />
                          : <ChevronDown className="h-3 w-3 text-blue-600" />
                      )}
                      {sortable && sortConfig?.key !== col.id && (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/30" />
                      )}
                    </div>
                  </TableHead>
                );
              })}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedLeads).map(([groupName, groupLeads]) => (
              <React.Fragment key={groupName}>
                {groupBy !== 'none' && (
                  <TableRow className="bg-muted/30 border-y border-slate-200">
                    <TableCell colSpan={visibleCols.length + 1} className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{groupName}</span>
                        <Badge variant="outline" className="text-[10px] ml-1 bg-white border-slate-200 text-slate-500 font-bold">
                          {groupLeads.length} {groupLeads.length === 1 ? 'Lead' : 'Leads'}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {groupLeads.length === 0 ? (
                  groupBy === 'none' && (
                    <TableRow>
                      <TableCell colSpan={visibleCols.length + 1} className="h-24 text-center text-muted-foreground">
                        No leads found.
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  groupLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors group">
                      {visibleCols.map(col => (
                        <TableCell key={col.id} className="py-2.5 h-12">
                          {renderCell(lead, col.id)}
                        </TableCell>
                      ))}

                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  onClick={() => navigate(`/leads/${lead.id}`, { state: { leadIds: groupLeads.map(l => l.id) } })}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {hasPermission("leads", PermissionActions.UPDATE) && (
                                      <DropdownMenuItem onClick={() => navigate(`/leads/edit/${lead.id}`)} className="gap-2">
                                        <Edit className="h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    {hasPermission("leads", PermissionActions.DELETE) && (
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(lead.id)}
                                        className="text-destructive focus:text-destructive gap-2"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TooltipTrigger>
                              <TooltipContent>More Actions</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
