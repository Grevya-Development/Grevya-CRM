import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Filter,
  Download,
  Clock,
  FileEdit,
  Trash2,
  Plus,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/supabase/supabaseClient';

/** How many of the newest entries to show (taken across all log tables). */
const LOG_LIMIT = 100;

type Resource = 'Lead' | 'Quotation' | 'Invoice' | 'Sales Team';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: Resource;
  details: string;
}

interface TextLogRow {
  id: string;
  action: string | null;
  details: string | null;
  performed_by: string | null;
  created_at: string;
}

interface SalesTeamLogRow {
  id: string;
  action: string;
  details: unknown;
  user_id: string | null;
  created_at: string;
}

const humanize = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** sales_team_audit_logs.details is jsonb — turn it into a short readable line. */
const summarizeDetails = (details: unknown): string => {
  if (details == null) return '';
  if (typeof details === 'string') return details;
  if (typeof details !== 'object') return String(details);
  return Object.entries(details as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${humanize(k)}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(', ');
};

const getActionIcon = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('creat') || a.includes('add')) return <Plus className="h-4 w-4 text-green-500" />;
  if (a.includes('delet') || a.includes('remov') || a.includes('deactivat'))
    return <Trash2 className="h-4 w-4 text-destructive" />;
  if (a.includes('updat') || a.includes('change') || a.includes('edit'))
    return <FileEdit className="h-4 w-4 text-primary" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
};

const getActionVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const a = action.toLowerCase();
  if (a.includes('creat') || a.includes('add')) return 'default';
  if (a.includes('delet') || a.includes('remov') || a.includes('deactivat')) return 'destructive';
  if (a.includes('updat') || a.includes('change') || a.includes('edit')) return 'secondary';
  return 'outline';
};

const initialsOf = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || '?';

const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    const textCols = 'id, action, details, performed_by, created_at';

    const [leadRes, quotationRes, invoiceRes, teamRes] = await Promise.all([
      supabase.from('lead_logs').select(textCols).order('created_at', { ascending: false }).limit(LOG_LIMIT),
      supabase.from('quotation_logs').select(textCols).order('created_at', { ascending: false }).limit(LOG_LIMIT),
      supabase.from('invoice_logs').select(textCols).order('created_at', { ascending: false }).limit(LOG_LIMIT),
      supabase
        .from('sales_team_audit_logs')
        .select('id, action, details, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(LOG_LIMIT),
    ]);

    const failed = [leadRes, quotationRes, invoiceRes, teamRes].filter((r) => r.error);
    if (failed.length > 0) {
      toast.error(`Some activity could not be loaded: ${failed[0].error?.message}`);
    }

    // sales_team_audit_logs stores a user id; resolve it to a name/email.
    const teamRows = (teamRes.data ?? []) as SalesTeamLogRow[];
    const userNames = new Map<string, string>();
    if (teamRows.some((r) => r.user_id)) {
      const { data: users } = await supabase.rpc('get_users');
      for (const u of (users ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
        userNames.set(u.id, u.full_name?.trim() || u.email || 'Unknown user');
      }
    }

    const fromText = (rows: TextLogRow[] | null, resource: Resource): AuditLog[] =>
      (rows ?? []).map((r) => ({
        id: `${resource}-${r.id}`,
        timestamp: r.created_at,
        user: r.performed_by?.trim() || 'Unknown user',
        action: r.action?.trim() || 'activity',
        resource,
        details: r.details ?? '',
      }));

    const merged: AuditLog[] = [
      ...fromText(leadRes.data as TextLogRow[] | null, 'Lead'),
      ...fromText(quotationRes.data as TextLogRow[] | null, 'Quotation'),
      ...fromText(invoiceRes.data as TextLogRow[] | null, 'Invoice'),
      ...teamRows.map((r) => ({
        id: `team-${r.id}`,
        timestamp: r.created_at,
        user: (r.user_id && userNames.get(r.user_id)) || 'Unknown user',
        action: r.action || 'activity',
        resource: 'Sales Team' as Resource,
        details: summarizeDetails(r.details),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, LOG_LIMIT);

    setLogs(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionOptions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action.toLowerCase()))).sort(),
    [logs]
  );

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      log.user.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.resource.toLowerCase().includes(term);
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase() === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource === resourceFilter;
    return matchesSearch && matchesAction && matchesResource;
  });

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.info('No log entries to export');
      return;
    }
    const header = ['Timestamp', 'User', 'Action', 'Resource', 'Details'].join(',');
    const rows = filteredLogs.map((l) =>
      [new Date(l.timestamp).toISOString(), l.user, l.action, l.resource, l.details]
        .map(csvEscape)
        .join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} log entries`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest {LOG_LIMIT} activity entries from leads, quotations, invoices and sales teams.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              disabled={loading || filteredLogs.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[170px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionOptions.map((a) => (
                <SelectItem key={a} value={a}>
                  {humanize(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Quotation">Quotation</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Sales Team">Sales Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Loading activity...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {logs.length === 0
                      ? 'No activity recorded yet.'
                      : 'No log entries match your filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {initialsOf(log.user)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{log.user}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge variant={getActionVariant(log.action)}>{humanize(log.action)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.resource}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
