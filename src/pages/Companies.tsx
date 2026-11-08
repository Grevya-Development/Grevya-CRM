import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Building2,
  Users,
  Briefcase,
  Globe,
  Edit,
  Trash2,
  RefreshCcw,
  IndianRupee
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import { Company } from '@/types';
import { Modal, message, Spin, Tooltip, Pagination } from 'antd';
import { toast } from 'sonner';

export default function Companies() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();

    const subscription = supabase
      .channel('companies_changes')
      .on('postgres_changes',
        { event: '*', table: 'companies', schema: 'public' },
        () => {
          fetchCompanies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this company?',
      content: `This will permanently remove ${name} and all its data.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Cancel',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id);

          if (error) throw error;
          message.success('Company deleted successfully');
        } catch (error: any) {
          console.error('Error deleting company:', error);
          message.error('Failed to delete company');
        }
      },
    });
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastCompany = currentPage * pageSize;
  const indexOfFirstCompany = indexOfLastCompany - pageSize;
  const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalCompanies = filteredCompanies.length;

  const stats = {
    total: companies.length,
    totalContacts: companies.reduce((sum, c) => sum + (c.contact_count || 0), 0),
    totalValue: companies.reduce((sum, c) => sum + Number(c.total_value || 0), 0),
  };

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Companies"
        showAddButton
        addButtonLabel="Add Company"
        onAdd={() => navigate('/companies/add')}
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 dark:border-primary/20 dark:bg-primary/10 p-4 transition-all hover:bg-primary/10">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Companies</p>
              <p className="text-2xl font-bold text-foreground leading-tight">{stats.total}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-primary/20 text-primary">
                Active directory
              </span>
            </div>
            <Building2 className="absolute right-4 bottom-4 h-8 w-8 text-primary opacity-20" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-purple-200/50 bg-purple-100/30 dark:border-purple-800/50 dark:bg-purple-900/10 p-4 transition-all hover:bg-purple-100/50">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Contacts</p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {stats.totalContacts}
              </p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-purple-200/50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                Across all accounts
              </span>
            </div>
            <Users className="absolute right-4 bottom-4 h-8 w-8 text-purple-500 opacity-20" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-emerald-200/50 bg-emerald-100/30 dark:border-emerald-800/50 dark:bg-emerald-900/10 p-4 transition-all hover:bg-emerald-100/50">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Leads Value</p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {formatRupees(stats.totalValue)}
              </p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-emerald-200/50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                Pipeline value
              </span>
            </div>
            <IndianRupee className="absolute right-4 bottom-4 h-8 w-8 text-emerald-500 opacity-20" />
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="flex justify-between items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, industry or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchCompanies} disabled={loading} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="w-[280px] font-bold">Company</TableHead>
                  <TableHead className="font-bold">Industry</TableHead>
                  <TableHead className="font-bold">Size</TableHead>
                  <TableHead className="font-bold text-right">Revenue</TableHead>
                  <TableHead className="font-bold text-center">Contacts</TableHead>
                  <TableHead className="font-bold text-right">Leads Value</TableHead>
                  <TableHead className="w-[120px] text-center font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCompanies.length > 0 ? (
                  currentCompanies.map((company) => (
                    <TableRow key={company.id} className="group transition-colors hover:bg-slate-50/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <p className="font-semibold text-slate-900 leading-none mb-1">{company.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{company.website || 'No website'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-medium">
                          {company.industry || 'Other'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">{company.size || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {company.revenue || 'N/A'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {company.contact_count || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {formatRupees(company.total_value || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {company.website && (
                            <Tooltip title="Visit Website">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => window.open(company.website!, '_blank')}
                              >
                                <Globe className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => navigate(`/companies/edit/${company.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDelete(company.id, company.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No companies found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {filteredCompanies.length > pageSize && (
          <div className="flex justify-end mt-4">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalCompanies}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              className="ant-pagination-mini"
            />
          </div>
        )}
      </div>
    </div>
  );
}
