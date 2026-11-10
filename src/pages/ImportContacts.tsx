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

type Section = 'customer' | 'address' | 'contact';

/**
 * Columns a file can fill, per table. Kept in step with the crm_customers,
 * crm_addresses and crm_contacts tables. (The app's public key can't read the
 * database schema, so this list can't be fetched at runtime.)
 */
const IMPORT_COLUMNS: Record<Section, string[]> = {
    customer: [
        'name', 'customer_type', 'industry', 'website_link', 'linkedin_url', 'gst_details',
        'credit_limit', 'payment_terms', 'annual_revenue', 'lead_source', 'priority',
        'engagement_probability', 'account_status',
    ],
    address: [
        'company_address', 'company_city', 'company_state', 'company_country', 'company_zip',
        'billing_address', 'billing_city', 'billing_state', 'billing_country', 'billing_zip',
        'shipping_address', 'shipping_city', 'shipping_state', 'shipping_country', 'shipping_zip',
    ],
    contact: ['name', 'designation', 'email', 'mobile_no', 'telephone', 'preferred_type', 'contact_type'],
};

const NUMERIC_COLUMNS = new Set(['customer.credit_limit', 'customer.annual_revenue', 'customer.engagement_probability']);
const LABEL_OVERRIDES: Record<string, string> = {
    website_link: 'Website',
    linkedin_url: 'LinkedIn URL',
    gst_details: 'GST Details',
    company_zip: 'Company PIN/ZIP',
    billing_zip: 'Billing PIN/ZIP',
    shipping_zip: 'Shipping PIN/ZIP',
    engagement_probability: 'Engagement Probability (%)',
};
const SECTION_LABEL: Record<Section, string> = { customer: 'Customer', address: 'Address', contact: 'Contact' };

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
    const [isDragging, setIsDragging] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setPreviewData([]);
            setImportResults(null);
            setSyncDetails([]);
        }
    }, [isOpen]);

    const getDynamicHeaders = (): { label: string; path: string }[] =>
        (Object.keys(IMPORT_COLUMNS) as Section[]).flatMap(section =>
            IMPORT_COLUMNS[section].map(col => ({
                label: `${SECTION_LABEL[section]} | ${LABEL_OVERRIDES[col] ?? toFriendly(col)}`,
                path: `${section}.${col}`,
            }))
        );

    const handleExportTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CRM Import Template');
        const dynamicHeaders = getDynamicHeaders();

        worksheet.columns = dynamicHeaders.map(h => ({
            header: h.label,
            key: h.path,
            width: Math.max(h.label.length + 8, 22)
        }));

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F3A' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
        });
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `grevya_customers_import_template.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);

        toast.success("Template downloaded. Customer | Name and Contact | Email are required.");
    };

    const processFile = (uploadedFile: File) => {
        if (!/\.(xlsx|xls|csv)$/i.test(uploadedFile.name)) {
            toast.error("Unsupported file. Please upload a .xlsx, .xls or .csv file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target?.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

                if (data.length < 2) {
                    toast.error("The file has no data rows. Add records below the header row.");
                    return;
                }

                const fileLabels = (data[0] || []).map(l => String(l ?? '').trim());
                const dynamicHeaders = getDynamicHeaders();
                const findHeader = (label: string) =>
                    dynamicHeaders.find(dh => dh.label.toLowerCase() === label.toLowerCase());

                const invalidLabels = fileLabels.filter(label => label && !findHeader(label));
                if (invalidLabels.length > 0) {
                    toast.error(`Unknown column${invalidLabels.length > 1 ? 's' : ''}: ${invalidLabels.slice(0, 3).join(', ')}. Please use the downloaded template.`);
                    return;
                }
                if (!fileLabels.some(l => findHeader(l)?.path === 'customer.name') ||
                    !fileLabels.some(l => findHeader(l)?.path === 'contact.email')) {
                    toast.error("The file must include the 'Customer | Name' and 'Contact | Email' columns.");
                    return;
                }

                const rows = data.slice(1);
                const errors: string[] = [];
                const mappedData: any[] = [];

                rows.forEach((row, index) => {
                    if (!row || row.every(cell => String(cell ?? '').trim() === '')) return;

                    const obj: any = {};
                    fileLabels.forEach((label, labelIndex) => {
                        const matched = label ? findHeader(label) : undefined;
                        if (!matched) return;
                        const raw = row[labelIndex];
                        const value = typeof raw === 'string' ? raw.trim() : raw;
                        if (value === '' || value === null || value === undefined) return;
                        obj[matched.path] = value;
                    });

                    const rowNo = index + 2;
                    if (!obj['customer.name'] || !obj['contact.email']) {
                        errors.push(`Row ${rowNo}: 'Customer | Name' and 'Contact | Email' are required`);
                        return;
                    }
                    for (const path of NUMERIC_COLUMNS) {
                        if (obj[path] === undefined) continue;
                        const n = Number(String(obj[path]).replace(/[,\s₹$%]/g, ''));
                        if (isNaN(n)) {
                            errors.push(`Row ${rowNo}: '${findHeaderByPath(path)}' must be a number`);
                            return;
                        }
                        obj[path] = path === 'customer.engagement_probability' ? Math.round(n) : n;
                    }
                    obj['customer.name'] = String(obj['customer.name']);
                    obj['contact.email'] = String(obj['contact.email']);
                    mappedData.push(obj);
                });

                if (errors.length > 0) {
                    toast.error(errors.length > 1 ? `${errors[0]} (and ${errors.length - 1} more)` : errors[0]);
                    return;
                }
                if (mappedData.length === 0) {
                    toast.error("No records found in the file.");
                    return;
                }

                setPreviewData(mappedData);
                setStep(3);
                toast.success(`Validated ${mappedData.length} record${mappedData.length > 1 ? 's' : ''}`);
            } catch (error) {
                console.error("Parsing error:", error);
                toast.error("Couldn't read this file. Please use the downloaded template.");
            }
        };
        reader.readAsArrayBuffer(uploadedFile);
    };

    const findHeaderByPath = (path: string) =>
        getDynamicHeaders().find(h => h.path === path)?.label ?? path;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // let the same file be picked again after fixing it
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
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

                if (!customerData.customer_type) customerData.customer_type = 'Prospect';
                if (!customerData.account_status) customerData.account_status = 'active';

                const { data: customer, error: custError } = await supabase
                    .from('crm_customers')
                    .insert([sanitize(customerData)])
                    .select()
                    .single();

                if (custError) {
                    console.error("Customer sync failed:", custError);
                    details.push({ data: row, status: 'error', error: custError.code === '23505' ? 'A customer with this name already exists' : `Customer: ${custError.message}` });
                    failCount++;
                    continue;
                }

                const customerId = customer.id;

                try {
                    if (Object.keys(sanitize(addressData)).length > 0) {
                        const { error: addrError } = await supabase
                            .from('crm_addresses')
                            .insert([sanitize({ ...addressData, customer_id: customerId })]);
                        if (addrError) throw addrError;
                    }

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
            if (failCount === 0) toast.success(`Imported ${successCount} customer${successCount === 1 ? '' : 's'}`);
            else toast.warning(`Imported ${successCount}, ${failCount} failed. See details below.`);
            if (onImportSuccess) onImportSuccess();
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Import stopped unexpectedly. Please try again.");
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

                        <div
                            className="w-full relative group"
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors group-hover:border-primary/50 group-hover:bg-slate-50/50 ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
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
                                Successfully imported <span className="font-bold text-slate-900">{importResults?.success}</span> {importResults?.success === 1 ? 'record' : 'records'}.
                                {importResults?.failed ? ` ${importResults.failed} failed.` : ''}
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

                        {importResults && importResults.failed > 0 && (
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
