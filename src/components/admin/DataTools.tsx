import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  File,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { contacts, Leads, companies, tasks } from '@/data/sampleData';

interface ImportPreview {
  headers: string[];
  rows: string[][];
  mapping: Record<string, string>;
}

export const DataTools: React.FC = () => {
  const [importType, setImportType] = useState('contacts');
  const [exportType, setExportType] = useState('contacts');
  const [exportFormat, setExportFormat] = useState('csv');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate file parsing
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 6).map(line => line.split(',').map(c => c.trim()));
      
      setImportPreview({
        headers,
        rows,
        mapping: headers.reduce((acc, h) => ({ ...acc, [h]: h.toLowerCase() }), {}),
      });
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setIsImporting(true);
    setImportProgress(0);

    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          toast.success('Import completed successfully!');
          setImportPreview(null);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleExport = () => {
    let data: any[] = [];
    switch (exportType) {
      case 'contacts': data = contacts; break;
      case 'Leads': data = Leads; break;
      case 'companies': data = companies; break;
      case 'tasks': data = tasks; break;
    }

    if (exportFormat === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => Object.values(item).join(','));
      const csv = [headers, ...rows].join('\n');
      downloadFile(csv, `${exportType}_export.csv`, 'text/csv');
    } else if (exportFormat === 'json') {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${exportType}_export.json`, 'application/json');
    } else {
      // Excel format would require a library like xlsx
      toast.info('Excel export would require xlsx library');
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded successfully`);
  };

  const exportStats = {
    contacts: contacts.length,
    Leads: Leads.length,
    companies: companies.length,
    tasks: tasks.length,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Import Type</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="Leads">Leads</SelectItem>
                <SelectItem value="companies">Companies</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your file here, or
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: CSV, XLSX, JSON
            </p>
          </div>

          {importPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Preview</h4>
                <Badge variant="secondary">
                  {importPreview.rows.length} rows shown
                </Badge>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {importPreview.headers.map((h, i) => (
                        <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.rows.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="whitespace-nowrap">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {isImporting ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleImport} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </Button>
                  <Button variant="outline" onClick={() => setImportPreview(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
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
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts">Contacts ({exportStats.contacts})</SelectItem>
                  <SelectItem value="Leads">Leads ({exportStats.Leads})</SelectItem>
                  <SelectItem value="companies">Companies ({exportStats.companies})</SelectItem>
                  <SelectItem value="tasks">Tasks ({exportStats.tasks})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
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
                <Badge variant="secondary">{exportStats[exportType as keyof typeof exportStats]}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Format</span>
                <Badge variant="outline">{exportFormat.toUpperCase()}</Badge>
              </div>
            </div>
          </div>

          <Button onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export {exportType.charAt(0).toUpperCase() + exportType.slice(1)}
          </Button>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Recent Exports</h4>
            <div className="space-y-2">
              {[
                { name: 'contacts_export.csv', date: '2024-12-05', records: 250, status: 'success' },
                { name: 'Leads_export.json', date: '2024-12-04', records: 85, status: 'success' },
                { name: 'companies_export.xlsx', date: '2024-12-03', records: 45, status: 'failed' },
              ].map((exp, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {exp.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{exp.name}</p>
                      <p className="text-xs text-muted-foreground">{exp.records} records</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{exp.date}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
