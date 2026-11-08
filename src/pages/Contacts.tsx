import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { Header } from '@/components/layout/Header';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ColumnManager } from '@/components/contacts/ColumnManager';
import { Button } from '@/components/ui/button';
import { userSettingsService, ColumnDefinition } from '@/services/userSettings';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, FileUp, Download, Upload, Users, UserPlus, Target, UserCheck, Settings2, Filter, Layers, X, CalendarDays } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Customer } from '@/types/index';
import { useNavigate } from 'react-router-dom';
import * as ExcelJS from 'exceljs';
import ImportContacts from './ImportContacts';
import { BulkScanModal } from '@/components/contacts/BulkScanModal';
import { CreditCard } from 'lucide-react';

const EXPORT_COLUMNS = [
  // Customers
  { header: 'Customer ID', key: 'customer.id', width: 20 },
  { header: 'Customer Name', key: 'customer.name', width: 25 },
  { header: 'Customer Type', key: 'customer.customer_type', width: 15 },
  { header: 'Profile URL', key: 'customer.profile_image_url', width: 30 },
  { header: 'Card URL', key: 'customer.scanned_card_url', width: 30 },
  { header: 'Website', key: 'customer.website_link', width: 25 },
  { header: 'Industry', key: 'customer.industry', width: 20 },
  { header: 'GST Details', key: 'customer.gst_details', width: 20 },
  { header: 'Credit Limit', key: 'customer.credit_limit', width: 15 },
  { header: 'Payment Terms', key: 'customer.payment_terms', width: 20 },
  { header: 'Multi-Currency', key: 'customer.is_multi_currency', width: 15, transform: (v: any) => v ? 'Yes' : 'No' },
  { header: 'LinkedIn', key: 'customer.linkedin_url', width: 25 },
  { header: 'Annual Revenue', key: 'customer.annual_revenue', width: 15 },
  { header: 'Sales Person ID', key: 'customer.sales_person_id', width: 15 },
  { header: 'Lead Source', key: 'customer.lead_source', width: 15 },
  { header: 'Priority', key: 'customer.priority', width: 10 },
  { header: 'Engage Prob', key: 'customer.engagement_probability', width: 15 },
  { header: 'Account Status', key: 'customer.account_status', width: 15 },
  { header: 'Cust Created', key: 'customer.created_at', width: 20, type: 'date' },

  // Address
  { header: 'Address ID', key: 'address.id', width: 15 },
  { header: 'Work Address', key: 'address.company_address', width: 30 },
  { header: 'City', key: 'address.company_city', width: 15 },
  { header: 'State', key: 'address.company_state', width: 15 },
  { header: 'Country', key: 'address.company_country', width: 15 },
  { header: 'Zip', key: 'address.company_zip', width: 10 },
  { header: 'Billing Address', key: 'address.billing_address', width: 30 },
  { header: 'Billing City', key: 'address.billing_city', width: 15 },
  { header: 'Billing State', key: 'address.billing_state', width: 15 },
  { header: 'Billing Country', key: 'address.billing_country', width: 15 },
  { header: 'Billing Zip', key: 'address.billing_zip', width: 10 },
  { header: 'Shipping Address', key: 'address.shipping_address', width: 30 },
  { header: 'Shipping City', key: 'address.shipping_city', width: 15 },
  { header: 'Shipping State', key: 'address.shipping_state', width: 15 },
  { header: 'Shipping Country', key: 'address.shipping_country', width: 15 },
  { header: 'Shipping Zip', key: 'address.shipping_zip', width: 10 },

  // Contact
  { header: 'Contact ID', key: 'id', width: 15 },
  { header: 'Contact Name', key: 'name', width: 25 },
  { header: 'Designation', key: 'designation', width: 20 },
  { header: 'Mobile No', key: 'mobile_no', width: 20 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Pref Type', key: 'preferred_type', width: 15 },
  { header: 'Addr Type', key: 'address_type', width: 15 },
  { header: 'Telephone', key: 'telephone', width: 20 },
  { header: 'Contact Created', key: 'created_at', width: 20, type: 'date' }
];

const defaultColumns: ColumnDefinition[] = [
  { id: "name", label: "Name", visible: true },
  { id: "email", label: "Email", visible: true },
  { id: "mobile_no", label: "Phone", visible: true },
  { id: "company", label: "Company", visible: true },
  { id: "designation", label: "Designation", visible: true },
  { id: "created_at", label: "Created At", visible: false },
];

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Customer[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkScanOpen, setIsBulkScanOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [columns, setColumns] = useState<ColumnDefinition[]>(defaultColumns);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [customFilters, setCustomFilters] = useState<{
    minRevenue?: number;
    maxRevenue?: number;
    fromDate?: Date;
    toDate?: Date;
  }>({});
  const [groupBy, setGroupBy] = useState<string>('none');

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleColumnsChange = async (newColumns: ColumnDefinition[]) => {
    setColumns(newColumns);
    const result = await userSettingsService.saveSettings({
      contact_columns: newColumns,
      column_order: newColumns.map(c => c.id),
    });

    if (!result.success) {
      console.warn('Failed to save column settings:', result.error);
      if (result.error?.message?.includes('Auth session missing')) {
        toast.error('Column preferences not saved: Please log in.');
      }
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*, customer:crm_customers(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to load contacts');
      } else {
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContact = (updatedContact: any) => {
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
  };

  const handleDeleteContact = (deletedId: string) => {
    setContacts(contacts.filter(c => c.id !== deletedId));
  };

  // Available options for filters
  const filterOptions = useMemo(() => {
    const industries = Array.from(new Set(contacts.map(c => (c.customer as any)?.industry || 'Unspecified'))).sort();
    const sources = Array.from(new Set(contacts.map(c => (c.customer as any)?.lead_source || 'Unknown'))).sort();
    const priorities = ['High', 'Medium', 'Low', 'None'];
    const contactTypes = Array.from(new Set(contacts.map(c => c.contact_type || 'Individual'))).sort();
    return { industries, sources, priorities, contactTypes };
  }, [contacts]);

  const filteredContacts = contacts.filter((contact: any) => {
    // 1. Search Term
    const fullName = (contact.name || '').toLowerCase();
    const email = (contact.email || '').toLowerCase();
    const designation = (contact.designation || '').toLowerCase();
    const companyName = (contact.customer as any)?.name?.toLowerCase() || '';
    const lowerSearch = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm ||
      fullName.includes(lowerSearch) ||
      email.includes(lowerSearch) ||
      designation.includes(lowerSearch) ||
      companyName.includes(lowerSearch);

    if (!matchesSearch) return false;

    // 2. Faceted Filters
    for (const [key, values] of Object.entries(activeFilters)) {
      if (!values.length) continue;

      let contactValue = '';
      if (key === 'contact_type') contactValue = contact.contact_type || 'Individual';
      else if (key === 'industry') contactValue = (contact.customer as any)?.industry || 'Unspecified';
      else if (key === 'lead_source') contactValue = (contact.customer as any)?.lead_source || 'Unknown';
      else if (key === 'priority') contactValue = (contact.customer as any)?.priority || 'None';

      if (!values.includes(contactValue)) return false;
    }

    // 3. Custom Filters
    const revenue = Number((contact.customer as any)?.annual_revenue || 0);
    if (customFilters.minRevenue !== undefined && revenue < customFilters.minRevenue) return false;
    if (customFilters.maxRevenue !== undefined && revenue > customFilters.maxRevenue) return false;

    if (customFilters.fromDate && contact.created_at && new Date(contact.created_at) < customFilters.fromDate) return false;
    if (customFilters.toDate && contact.created_at && new Date(contact.created_at) > customFilters.toDate) return false;

    return true;
  });

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const removeFilterValue = (category: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(v => v !== value)
    }));
  };

  const resetAllFilters = () => {
    setActiveFilters({});
    setCustomFilters({});
    setSearchTerm('');
  };

  const stats = {
    total: contacts.length,
    active: contacts.length,
    prospects: contacts.filter((c: any) => c.contact_type === 'Prospect').length,
    customers: contacts.filter((c: any) => c.contact_type === 'Customer').length,
  };


  const isDefaultSelection = () => {
    if (columns.length !== defaultColumns.length) return false;
    return columns.every((col, idx) => col.visible === defaultColumns[idx].visible);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const isFullExport = isDefaultSelection() && !searchTerm && statusFilter === 'all';
      let exportData: any[] = [];
      let exportColumns: { header: string; key: string; width: number }[] = [];

      if (isFullExport) {
        toast.info('Fetching full data for export...');
        let query = supabase
          .from('crm_contacts')
          .select(`
            *,
            customer:crm_customers (
              *,
              addresses:crm_addresses (*)
            )
          `);

        // if (exportLimit !== 'all') {
        //   query = query.limit(Number(exportLimit));
        // }

        const { data, error } = await query;

        if (error) throw error;
        exportData = data || [];

        // Dynamic Column Discovery (Auto-Discovery)
        const discoveredKeys = new Set(EXPORT_COLUMNS.map(c => c.key));
        const autoColumns: any[] = [];

        if (exportData.length > 0) {
          const firstItem = exportData[0];

          // Discover simple unmapped database columns from crm_contacts
          Object.keys(firstItem).forEach(dbKey => {
            if (!discoveredKeys.has(dbKey) && typeof firstItem[dbKey] !== 'object' && dbKey !== 'customer') {
              autoColumns.push({ header: `[DB] ${dbKey}`, key: dbKey, width: 20 });
              discoveredKeys.add(dbKey);
            }
          });

          // Discover custom_fields
          if (firstItem.custom_fields && typeof firstItem.custom_fields === 'object') {
            Object.keys(firstItem.custom_fields).forEach(cfKey => {
              const fullKey = `custom_fields.${cfKey}`;
              if (!discoveredKeys.has(fullKey)) {
                autoColumns.push({ header: `[CF] ${cfKey}`, key: fullKey, width: 20 });
                discoveredKeys.add(fullKey);
              }
            });
          }
        }

        exportColumns = [...EXPORT_COLUMNS, ...autoColumns];
      } else {
        const visibleCols = columns.filter(col => col.visible);
        if (visibleCols.length === 0) {
          toast.error('No columns selected for export');
          return;
        }
        exportData = filteredContacts;
        // if (exportLimit !== 'all') {
        //   exportData = exportData.slice(0, Number(exportLimit));
        // }
        exportColumns = visibleCols.map(col => ({
          header: col.label,
          key: col.id,
          width: col.id === 'email' ? 35 : (col.id === 'name' ? 25 : 20)
        }));
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Export');
      worksheet.columns = exportColumns;

      if (exportData.length === 0) {
        toast.error('No data found to export');
        return;
      }


      const getDeepValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };

      exportData.forEach((item: any) => {
        let rowData: Record<string, any> = {};

        if (isFullExport) {
          const cust = item.customer || {};
          const addrList = cust.addresses || cust.crm_addresses || [];
          const addr = (Array.isArray(addrList) ? addrList[0] : addrList) || {};


          const contextItem = {
            ...item,
            customer: cust,
            address: addr
          };

          exportColumns.forEach((col: any) => {
            let val = getDeepValue(contextItem, col.key);

            // Apply custom transform if defined
            if (col.transform) val = col.transform(val);

            // Format dates
            if (col.type === 'date' && val) {
              val = new Date(val).toLocaleString();
            }

            rowData[col.key] = val ?? '';
          });
        } else {
          const colAccessors: Record<string, (c: any) => string> = {
            name: (c) => c.name || '',
            email: (c) => c.email || '',
            mobile_no: (c) => c.mobile_no || '',
            company: (c) => (c.customer as any)?.name || '',
            designation: (c) => c.designation || '',
            contact_type: (c) => c.contact_type || '',
            created_at: (c) => c.created_at ? new Date(c.created_at).toLocaleDateString() : '-',
          };

          exportColumns.forEach((col: any) => {
            const accessor = colAccessors[col.key];
            rowData[col.key] = accessor ? accessor(item) : (item.custom_fields?.[col.key] || '');
          });
        }

        if (format === 'csv') {
          Object.keys(rowData).forEach(key => {
            const val = String(rowData[key] || '');
            if (/^\+?\d{10,}$/.test(val) || val.includes('+')) {
              rowData[key] = `="${val}"`;
            }
          });
        }
        worksheet.addRow(rowData);
      });

      if (format === 'csv') {
        const buffer = await workbook.csv.writeBuffer();
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        const blob = new Blob([bom, buffer], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(url);
        toast.success('CSV exported successfully');
      }

      if (format === 'excel') {
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          row.height = rowNumber === 1 ? 35 : 25;

          row.eachCell({ includeEmpty: true }, (cell) => {
            if (rowNumber === 1) {
              cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF3B82F6' }
              };
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            } else {
              cell.font = { size: 11, name: 'Calibri' };
              cell.alignment = { vertical: 'middle', horizontal: 'left' };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
              };

              const val = String(cell.value || '');
              if (/^\+?\d{10,}$/.test(val)) {
                cell.numFmt = '@';
              }
            }
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();

        URL.revokeObjectURL(url);
        toast.success('Excel exported successfully');
      }

    } catch (error) {
      console.error(error);
      toast.error('Export failed');
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Customers"
      />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="relative overflow-hidden rounded-lg border border-border bg-white p-2 border-l-4 border-l-blue-500 shadow-md">
            <div className="relative z-10">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Customers</p>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{stats.total}</p>
              <p className="text-[11px] text-slate-400">
                Last updated today
              </p>
            </div>
            <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500 opacity-20" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border bg-white p-2 border-l-4 border-l-amber-500 shadow-md">
            <div className="relative z-10">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Prospects</p>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{stats.prospects}</p>
              <p className="text-[11px] text-slate-400">
                Last updated today
              </p>
            </div>
            <Target className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-500 opacity-20" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border bg-white p-2 border-l-4 border-l-green-500 shadow-md">
            <div className="relative z-10">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Active</p>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{stats.active}</p>
              <p className="text-[11px] text-slate-400">
                Last updated today
              </p>
            </div>
            <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-96">
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-7 text-[11px] text-blue-600 hover:text-blue-700 px-2">
                      Clear All
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[450px]">
                  <div className="p-4 space-y-6">
                    {/* Status / Contact Type */}
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Contact Type</Label>
                      <div className="space-y-2">
                        {['Individual', 'Company', 'Partner', 'Vendor'].map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`type-${type}`}
                              checked={activeFilters.contact_type?.includes(type)}
                              onCheckedChange={() => toggleFilter('contact_type', type)}
                            />
                            <Label htmlFor={`type-${type}`} className="text-sm font-medium leading-none cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Industry */}
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Industry</Label>
                      <div className="space-y-2">
                        {Array.from(new Set(contacts.map(c => (c.customer as any)?.industry || 'Unspecified'))).sort().map(industry => (
                          <div key={industry} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ind-${industry}`}
                              checked={activeFilters.industry?.includes(industry)}
                              onCheckedChange={() => toggleFilter('industry', industry)}
                            />
                            <Label htmlFor={`ind-${industry}`} className="text-sm font-medium leading-none cursor-pointer truncate max-w-[200px]">
                              {industry}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Priority */}
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Priority</Label>
                      <div className="space-y-2">
                        {['High', 'Medium', 'Low', 'None'].map(prio => (
                          <div key={prio} className="flex items-center space-x-2">
                            <Checkbox
                              id={`prio-${prio}`}
                              checked={activeFilters.priority?.includes(prio)}
                              onCheckedChange={() => toggleFilter('priority', prio)}
                            />
                            <Label htmlFor={`prio-${prio}`} className="text-sm font-medium leading-none cursor-pointer">
                              {prio}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Custom Ranges */}
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                        <Settings2 className="h-3 w-3" />
                        Custom Ranges
                      </Label>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Annual Revenue</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              className="h-8 text-xs"
                              value={customFilters.minRevenue || ''}
                              onChange={(e) => setCustomFilters(prev => ({ ...prev, minRevenue: e.target.value ? Number(e.target.value) : undefined }))}
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              className="h-8 text-xs"
                              value={customFilters.maxRevenue || ''}
                              onChange={(e) => setCustomFilters(prev => ({ ...prev, maxRevenue: e.target.value ? Number(e.target.value) : undefined }))}
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
                  <SelectItem value="industry">By Industry</SelectItem>
                  <SelectItem value="account_status">By Status</SelectItem>
                  <SelectItem value="priority">By Priority</SelectItem>
                  <SelectItem value="lead_source">By Source</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-10 w-10 p-0 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                    onClick={() => navigate('/contacts/add')}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Customer</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-10 p-0 border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsImportOpen(true)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import Contacts</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        aria-label="Export Contacts"
                        className="h-10 w-10 p-0 border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Export Contacts</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-10 p-0 border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsBulkScanOpen(true)}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Scan Cards</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ColumnManager
              columns={columns}
              onColumnsChange={handleColumnsChange}
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
                  <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">{category.replace('_', ' ')}:</span>
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

            {customFilters.minRevenue !== undefined && (
              <Badge variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-white border border-slate-200 text-slate-700 font-medium tracking-tight">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">Min Rev:</span>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(customFilters.minRevenue)}
                <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0 ml-1" onClick={() => setCustomFilters(prev => ({ ...prev, minRevenue: undefined }))}>
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {customFilters.maxRevenue !== undefined && (
              <Badge variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 bg-white border border-slate-200 text-slate-700 font-medium tracking-tight">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5">Max Rev:</span>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(customFilters.maxRevenue)}
                <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0 ml-1" onClick={() => setCustomFilters(prev => ({ ...prev, maxRevenue: undefined }))}>
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

            <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-6 text-[10px] text-muted-foreground hover:text-blue-600 transition-colors underline underline-offset-4">
              Reset All
            </Button>
          </div>
        )}

        <ContactsTable
          contacts={filteredContacts}
          loading={loading}
          onUpdate={handleUpdateContact}
          onDelete={handleDeleteContact}
          columns={columns}
          groupBy={groupBy}
        />
        <ImportContacts
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={() => {
            setIsImportOpen(false);
            fetchContacts();
          }}
        />
        <BulkScanModal
          isOpen={isBulkScanOpen}
          onClose={() => setIsBulkScanOpen(false)}
          onSuccess={() => {
            fetchContacts();
          }}
        />
      </div>
    </div>
  );
}
