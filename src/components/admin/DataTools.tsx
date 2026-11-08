import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Download, FileSpreadsheet, FileJson, File, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/supabase/supabaseClient';

type ExportType = 'customers' | 'contacts' | 'leads' | 'tasks';
type ExportFormat = 'csv' | 'json' | 'xlsx';

/** Real Supabase tables behind each export option. */
const EXPORT_SOURCES: Record<ExportType, { label: string; table: string; activeOnly?: boolean }> = {
  customers: { label: 'Customers', table: 'crm_customers' },
  contacts: { label: 'Contacts', table: 'crm_contacts' },
  // Same filter the Leads page uses: hide soft-deleted leads.
  leads: { label: 'Leads', table: 'crm_leads', activeOnly: true },
  tasks: { label: 'Tasks', table: 'crm_tasks' },
};

const PAGE_SIZE = 1000;

const buildQuery = (type: ExportType, head = false) => {
  const { table, activeOnly } = EXPORT_SOURCES[type];
  let query = supabase
    .from(table)
    .select('*', head ? { count: 'exact', head: true } : undefined);
  if (activeOnly) query = query.or('is_deleted.eq.false,is_deleted.is.null');
  return query;
};

/** Fetch every row of the table, paging past PostgREST's per-request row cap. */
const fetchAllRows = async (type: ExportType): Promise<Record<string, unknown>[]> => {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery(type)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
};

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const toCsv = (rows: Record<string, unknown>[]): string => {
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map((r) => headers.map((h) => escape(cellToString(r[h]))).join(','));
  return [headers.map(escape).join(','), ...lines].join('\n');
};

const downloadFile = (content: BlobPart, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const DataTools: React.FC = () => {
  const navigate = useNavigate();
  const [exportType, setExportType] = useState<ExportType>('contacts');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [counts, setCounts] = useState<Partial<Record<ExportType, number>>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const types = Object.keys(EXPORT_SOURCES) as ExportType[];
      const results = await Promise.all(types.map((t) => buildQuery(t, true)));
      if (cancelled) return;
      const next: Partial<Record<ExportType, number>> = {};
      results.forEach((res, i) => {
        if (!res.error && typeof res.count === 'number') next[types[i]] = res.count;
      });
      setCounts(next);
      setLoadingCounts(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = async () => {
    const { label } = EXPORT_SOURCES[exportType];
    setIsExporting(true);
    try {
      const rows = await fetchAllRows(exportType);
      if (rows.length === 0) {
        toast.info(`There are no ${label.toLowerCase()} to export`);
        return;
      }

      const base = `${exportType}_export_${new Date().toISOString().slice(0, 10)}`;
      if (exportFormat === 'csv') {
        downloadFile(toCsv(rows), `${base}.csv`, 'text/csv');
      } else if (exportFormat === 'json') {
        downloadFile(JSON.stringify(rows, null, 2), `${base}.json`, 'application/json');
      } else {
        const sheetRows = rows.map((r) =>
          Object.fromEntries(Object.entries(r).map(([k, v]) => [k, cellToString(v)]))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetRows), label);
        XLSX.writeFile(workbook, `${base}.xlsx`);
      }
      toast.success(`Exported ${rows.length} ${label.toLowerCase()}`);
    } catch (err: any) {
      toast.error(`Export failed: ${err?.message || 'unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const countLabel = (type: ExportType) => {
    if (loadingCounts) return '…';
    return counts[type] ?? '—';
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Import Section — the real importer lives on the Contacts page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Contacts can be imported from a CSV or Excel file using the <strong>Import</strong>{' '}
            button on the Contacts page. Bulk import for other record types is not available yet.
          </p>
          <Button variant="outline" onClick={() => navigate('/contacts')}>
            <Upload className="h-4 w-4 mr-2" />
            Go to Contacts
          </Button>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXPORT_SOURCES) as ExportType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {EXPORT_SOURCES[t].label} ({countLabel(t)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </div>
                  </SelectItem>
                  <SelectItem value="xlsx">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      Excel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-3">Export Summary</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Records to export</span>
                <Badge variant="secondary">{countLabel(exportType)}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Format</span>
                <Badge variant="outline">{exportFormat.toUpperCase()}</Badge>
              </div>
            </div>
          </div>

          <Button onClick={handleExport} className="w-full" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : `Export ${EXPORT_SOURCES[exportType].label}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
