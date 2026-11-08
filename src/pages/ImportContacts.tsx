import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/supabase/supabaseClient';
import { ColumnDefinition } from '@/services/userSettings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ExcelJS from 'exceljs';

interface TableColumn {
    name: string;
    isNullable: boolean;
    defaultValue: string | null;
}

interface DbSchema {
    customers: TableColumn[];
    addresses: TableColumn[];
    contacts: TableColumn[];
}

const tableFriendlyNames: Record<string, string> = {
    'crm_customers': 'Customer',
    'crm_addresses': 'Address',
    'crm_contacts': 'Contact'
};

const toFriendly = (str: string) =>
    str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

// Simplified view for the preview table
const defaultColumns: ColumnDefinition[] = [
    { id: "customer.name", label: "Company", visible: true },
    { id: "customer.industry", label: "Industry", visible: true },
    { id: "contact.name", label: "Contact Name", visible: true },
    { id: "contact.email", label: "Email", visible: true },
    { id: "address.company_city", label: "Location", visible: true },
];

interface ImportContactsProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess?: () => void;
}

export default function ImportContacts({ isOpen, onClose, onImportSuccess }: ImportContactsProps) {
    const [step, setStep] = useState(1);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
    const [syncDetails, setSyncDetails] = useState<{ data: any; status: 'success' | 'error'; error?: string }[]>([]);
    const [schema, setSchema] = useState<DbSchema | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setPreviewData([]);
            setImportResults(null);
            setSyncDetails([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchSchema = async () => {
            try {
                const supabaseUrl = (supabase as any).supabaseUrl;
                const supabaseKey = (supabase as any).supabaseKey;
                const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    }
                });

                if (!response.ok) throw new Error("Failed to fetch OpenAPI spec");

                const spec = await response.json();
                const definitions = spec.definitions || {};

                const extractCols = (tableName: string): TableColumn[] => {
                    const def = definitions[tableName];
                    if (!def || !def.properties) return [];

                    const required = def.required || [];
                    return Object.keys(def.properties).map(colName => ({
                        name: colName,
                        isNullable: !required.includes(colName),
                        defaultValue: null
                    }));
                };

                setSchema({
                    customers: extractCols('crm_customers'),
                    addresses: extractCols('crm_addresses'),
                    contacts: extractCols('crm_contacts')
                });
            } catch (err) {
                console.error("Failed to fetch schema:", err);
                toast.error("Sync failed. Contact support.");
            }
        };
        fetchSchema();
    }, [isOpen]);

    const getDynamicHeaders = (): { label: string; path: string }[] => {
        if (!schema) return [];
        const result: { label: string; path: string }[] = [];

        const isExcluded = (name: string) => {
            const n = name.toLowerCase();
            return (
                n === 'id' ||
                n.endsWith('_at') ||
                n.endsWith('_id') ||
                n.includes('image') ||
                n.includes('url') ||
                n.includes('link') ||
                n.includes('scanned_card') ||
                n.startsWith('is_') ||
                n.startsWith('has_') ||
                n.startsWith('enable_')
            );
        };

        schema.customers.filter(c => !isExcluded(c.name)).forEach(c => result.push({ label: `Customer | ${toFriendly(c.name)}`, path: `customer.${c.name}` }));
        schema.addresses.filter(c => !isExcluded(c.name)).forEach(c => result.push({ label: `Address | ${toFriendly(c.name)}`, path: `address.${c.name}` }));
        schema.contacts.filter(c => !isExcluded(c.name)).forEach(c => result.push({ label: `Contact | ${toFriendly(c.name)}`, path: `contact.${c.name}` }));

        return result;
    };

    const handleExportTemplate = async () => {
        if (!schema) {
            toast.error("Schema not yet loaded. Please wait a moment.");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CRM Import Template');
        const dynamicHeaders = getDynamicHeaders();
        const headerLabels = dynamicHeaders.map(h => h.label);

        const headerRow = worksheet.addRow(headerLabels);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF5D4461' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
        });

        worksheet.columns = dynamicHeaders.map(h => ({
            header: h.label,
            key: h.path,
            width: Math.max(h.label.length + 8, 22)
        }));

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `crm_focused_template_${new Date().toISOString().slice(0, 10)}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);

        toast.success("Focused Template downloaded");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!schema) {
            toast.error("Database schema not ready. Please try again in 2 seconds.");
            return;
        }

        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length < 1) {
                    toast.error("The file appears to be empty");
                    return;
                }

                const fileLabels = (data[0] as string[]).map(l => l?.trim());
                const dynamicHeaders = getDynamicHeaders();

                const invalidLabels = fileLabels.filter(label => {
                    if (!label) return false;
                    const matched = dynamicHeaders.find(dh => dh.label.toLowerCase() === label.toLowerCase());
                    return !matched;
                });

                if (invalidLabels.length > 0) {
                    toast.error(`Invalid Headers Found: ${invalidLabels.slice(0, 2).join(', ')}. Please use the Focused Template.`);
                    return;
                }

                const rows = data.slice(1) as any[][];

                const mappedData = rows.map((row, index) => {
                    if (!row || row.length === 0 || row.every(cell => !cell)) return null;

                    const obj: any = {};
                    fileLabels.forEach((label, labelIndex) => {
                        const matched = dynamicHeaders.find(dh => dh.label.toLowerCase() === label?.toLowerCase());
                        if (matched) {
                            obj[matched.path] = row[labelIndex];
                        }
                    });

                    if (!obj['customer.name'] || !obj['contact.email']) {
                        return { _rowError: `Row ${index + 2}: Missing mandatory 'Customer | Name' or 'Contact | Email'` };
                    }

                    return obj;
                }).filter(Boolean);

                const rowErrors = mappedData.filter((d: any) => d._rowError);
                if (rowErrors.length > 0) {
                    toast.error((rowErrors[0] as any)._rowError);
                    return;
                }

                if (mappedData.length === 0) {
                    toast.error("No valid records found after validation.");
                    return;
                }

                setPreviewData(mappedData);
                setStep(3);
                toast.success(`Validated ${mappedData.length} records`);
            } catch (error) {
                console.error("Parsing error:", error);
                toast.error("Failed to parse file. Please use a valid template.");
            }
        };
        reader.readAsBinaryString(uploadedFile);
    };

    const sanitize = (obj: any) => {
        const result: any = {};
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            if (val !== "" && val !== null && val !== undefined) {
                result[key] = val;
            }
        });
        return result;
    };

    const handleImport = async () => {
        setIsImporting(true);
        let successCount = 0;
        let failCount = 0;
        const details: { data: any; status: 'success' | 'error'; error?: string }[] = [];

        try {
            for (const row of previewData) {
                const customerData: any = {};
                const addressData: any = {};
                const contactData: any = {};

                Object.keys(row).forEach(key => {
                    if (key === '_rowError') return;
                    const value = row[key];
                    if (key.startsWith('customer.')) customerData[key.replace('customer.', '')] = value;
                    if (key.startsWith('address.')) addressData[key.replace('address.', '')] = value;
                    if (key.startsWith('contact.')) contactData[key.replace('contact.', '')] = value;
                });

                const { data: customer, error: custError } = await supabase
                    .from('crm_customers')
                    .insert([sanitize(customerData)])
                    .select()
                    .single();

                if (custError) {
                    console.error("Customer sync failed:", custError);
                    details.push({ data: row, status: 'error', error: `Customer: ${custError.message}` });
                    failCount++;
                    continue;
                }

                const customerId = customer.id;

                try {
                    const sanitizedAddress = sanitize({ ...addressData, customer_id: customerId });
                    const { error: addrError } = await supabase
                        .from('crm_addresses')
                        .insert([sanitizedAddress]);

                    if (addrError) throw addrError;

                    const sanitizedContact = sanitize({ ...contactData, customer_id: customerId });
                    const { error: contError } = await supabase
                        .from('crm_contacts')
                        .insert([sanitizedContact]);

                    if (contError) throw contError;

                    details.push({ data: row, status: 'success' });
                    successCount++;
                } catch (rollbackErr: any) {
                    console.error("Rolling back record due to partial failure:", rollbackErr);
                    await supabase.from('crm_customers').delete().eq('id', customerId);
                    details.push({ data: row, status: 'error', error: rollbackErr.message || 'Partial sync failure' });
                    failCount++;
                }
            }

            setImportResults({ success: successCount, failed: failCount });
            setSyncDetails(details);
            setStep(4);
            toast.success("Import processed");
            if (onImportSuccess) onImportSuccess();
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Critical error during synchronization");
        } finally {
            setIsImporting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="flex flex-col items-center justify-center py-6 space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Upload Contacts File
                            </h3>
                            <p className="text-sm text-slate-500">
                                Drag and drop or browse to upload your Excel/CSV file.
                            </p>
                        </div>

                        <div className="w-full relative group">
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center transition-colors group-hover:border-primary/50 group-hover:bg-slate-50/50">
                                <Upload className="h-10 w-10 text-slate-300 mb-4 group-hover:text-primary transition-colors" />
                                <label className="cursor-pointer">
                                    <span className="bg-primary text-primary-foreground hover:bg-primary/90 shadow h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        Browse Files
                                    </span>
                                    <input
                                        type="file"
                                        accept=".csv, .xlsx, .xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                                <p className="mt-2 text-xs text-slate-400">
                                    Supported formats: .xlsx, .xls, .csv
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportTemplate}
                                className="text-xs h-8 gap-2"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download Template
                            </Button>
                        </div>
                    </div>
                );
            case 3: // Stage 2: Preview
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900">Review Records</h3>
                                <p className="text-xs text-slate-500">{previewData.length} records found</p>
                            </div>
                            <Button size="sm" onClick={handleImport} disabled={isImporting}>
                                {isImporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Sync & Import
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="border rounded-md max-h-[300px] overflow-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0">
                                    <TableRow>
                                        {defaultColumns.map(col => (
                                            <TableHead key={col.id} className="h-8 text-xs font-medium">{col.label}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, i) => (
                                        <TableRow key={i}>
                                            {defaultColumns.map(col => (
                                                <TableCell key={col.id} className="py-2 text-xs truncate max-w-[150px]">
                                                    {row[col.id] || '-'}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                );
            case 4: // Results
                return (
                    <div className="space-y-6 py-4">
                        <div className="text-center space-y-2">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mb-2">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Import Completed</h3>
                            <p className="text-sm text-slate-500">
                                Successfully imported <span className="font-bold text-slate-900">{importResults?.success}</span> records.
                                {importResults?.failed ? ` Failed: ${importResults.failed}` : ''}
                            </p>
                        </div>

                        <div className="flex justify-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                                Import More
                            </Button>
                            <Button size="sm" onClick={onClose}>
                                Done
                            </Button>
                        </div>

                        {importResults?.failed && importResults.failed > 0 && (
                            <div className="border rounded-md max-h-[200px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="h-8 text-xs">Status</TableHead>
                                            <TableHead className="h-8 text-xs">Company</TableHead>
                                            <TableHead className="h-8 text-xs">Error</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {syncDetails.filter(d => d.status === 'error').map((detail, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="py-2"><AlertCircle className="h-3 w-3 text-red-500" /></TableCell>
                                                <TableCell className="py-2 text-xs">{detail.data['customer.name']}</TableCell>
                                                <TableCell className="py-2 text-xs text-red-600">{detail.error}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                </DialogHeader>
                {renderStep()}
            </DialogContent>
        </Dialog>
    );
}
