import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/supabase/supabaseClient';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Check, X, ChevronLeft, Search, Database } from 'lucide-react';
import { toast } from 'sonner';

interface MasterRecord {
    id: string;
    value: string;
    is_active: boolean;
    created_at: string;
}

const TABLE_MAP: Record<string, string> = {
    'customers.titles': 'm_customer_titles',
    'customers.comm_prefs': 'm_customer_comm_prefs',
    'customers.contact_types': 'm_customer_contact_types',
    'customers.statuses': 'm_customer_statuses',
    'customers.lead_sources': 'm_customer_lead_sources',
};

const masterMeta: Record<string, Record<string, { title: string; defaultValues: string[] }>> = {
    customers: {
        titles: { title: 'Titles', defaultValues: ['Mr', 'Ms', 'Dr', 'Prof'] },
        comm_prefs: { title: 'Preferred Communication', defaultValues: ['Email', 'Phone', 'WhatsApp'] },
        contact_types: { title: 'Contact Type', defaultValues: ['Prospect', 'Customer', 'Partner'] },
        statuses: { title: 'Status', defaultValues: ['Active', 'Inactive', 'Suspended'] },
        lead_sources: { title: 'Lead Source', defaultValues: ['Website', 'Referral', 'Trade Show'] },
    },
    leads: {
        lead_scores: { title: 'Lead Scores', defaultValues: ['0-20', '21-50', '51-80', '81-100'] },
        lead_industries: { title: 'Industrial Segments', defaultValues: ['IT', 'Manufacturing', 'Finance'] },
        tags: { title: 'Lead Tags', defaultValues: ['Urgent', 'Cold', 'High Value'] },
    },
    companies: {
        company_sizes: { title: 'Employee Brackets', defaultValues: ['1-10', '11-50', '51-200', '201-500', '500+'] },
        regions: { title: 'Operational Regions', defaultValues: ['North America', 'Europe', 'Asia Pacific', 'Latin America'] },
        tax_profiles: { title: 'Tax Classifications', defaultValues: ['Standard Rate', 'Reduced Rate', 'Zero Rated', 'Exempt'] },
    },
    products: {
        uom: { title: 'Units of Measure', defaultValues: ['Each', 'Kilogram', 'Meter', 'Liter', 'Box'] },
        product_categories: { title: 'Product Groups', defaultValues: ['Electronics', 'Furniture', 'Software', 'Services'] },
    }
};

export default function MasterDetails() {
    const navigate = useNavigate();
    const { category, type } = useParams<{ category: string; type: string }>();

    const meta = category && type ? masterMeta[category]?.[type] : null;
    const [records, setRecords] = useState<MasterRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isOpen, setIsOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        const fetchRecords = async () => {
            if (!meta || !category || !type) return;

            setLoading(true);
            const tableName = TABLE_MAP[`${category}.${type}`];

            if (tableName) {
                try {
                    const { data, error } = await supabase
                        .from(tableName)
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setRecords(data || []);
                } catch (error: any) {
                    toast.error(`Error fetching data: ${error.message}`);
                    setRecords([]);
                } finally {
                    setLoading(false);
                }
            } else {
                toast.error(`Table mapping not found for ${category}.${type}`);
                setRecords([]);
                setLoading(false);
            }
        };

        fetchRecords();
    }, [meta, category, type]);

    const handleAdd = async () => {
        if (!newName.trim()) {
            toast.error('Value cannot be empty');
            return;
        }

        const tableName = TABLE_MAP[`${category}.${type}`];
        if (tableName) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .insert([{ value: newName, is_active: true }])
                    .select()
                    .single();

                if (error) throw error;
                setRecords([data, ...records]);
                setNewName('');
                setIsOpen(false);
                toast.success('Record added successfully');
            } catch (error: any) {
                toast.error(`Failed to add record: ${error.message}`);
            }
        }
    };

    const handleEdit = async () => {
        if (!editName.trim()) {
            toast.error('Value cannot be empty');
            return;
        }

        if (editingId) {
            const tableName = TABLE_MAP[`${category}.${type}`];
            if (tableName) {
                try {
                    const { error } = await supabase
                        .from(tableName)
                        .update({ value: editName })
                        .eq('id', editingId);

                    if (error) throw error;
                    setRecords(records.map(r => r.id === editingId ? { ...r, value: editName } : r));
                    setEditingId(null);
                    setEditName('');
                    toast.success('Record updated successfully');
                } catch (error: any) {
                    toast.error(`Update failed: ${error.message}`);
                }
            }
        }
    };

    const handleDelete = async (id: string) => {
        const tableName = TABLE_MAP[`${category}.${type}`];
        if (tableName) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                setRecords(records.filter(r => r.id !== id));
                toast.info('Record deleted successfully');
            } catch (error: any) {
                toast.error(`Delete failed: ${error.message}`);
            }
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const tableName = TABLE_MAP[`${category}.${type}`];
        if (tableName) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .update({ is_active: !currentStatus })
                    .eq('id', id);

                if (error) throw error;
                setRecords(records.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
                toast.success(`Status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
            } catch (error: any) {
                toast.error(`Status update failed: ${error.message}`);
            }
        }
    };

    const filteredRecords = records.filter(r =>
        r.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!meta) {
        return (
            <div className="p-8 text-center space-y-4">
                <h2 className="text-xl font-bold text-destructive">Master Configuration Not Found</h2>
                <Button onClick={() => navigate('/configuration/masters')}>Return to Masters</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background/50">
            <Header
                title={meta.title}
            />

            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg bg-card"
                            onClick={() => navigate(category ? `/configuration/masters/${category}` : '/configuration/masters')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div>

                            <h2 className="text-2xl font-bold tracking-tight">{meta.title}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search values..."
                                className="pl-8 h-9 w-[200px] lg:w-[300px] bg-card"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 h-9">
                                    <Plus className="h-4 w-4" />
                                    New Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add to {meta.title}</DialogTitle>
                                    <DialogDescription>
                                        Create a new reusable value for this master category.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Input
                                        placeholder="Enter value name..."
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        autoFocus
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAdd}>Add Value</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm shadow-primary/5">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-12 h-12 text-center">#</TableHead>
                                <TableHead className="font-semibold text-foreground">Master Value Name</TableHead>
                                <TableHead className="font-semibold text-foreground">Creation Date</TableHead>
                                <TableHead className="font-semibold text-foreground">Current Status</TableHead>
                                <TableHead className="text-right font-semibold text-foreground pr-6">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span>Loading master data...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Database className="h-10 w-10 opacity-20" />
                                            <p className="font-medium">No results found</p>
                                            <p className="text-xs">Try adjusting your search or add a new entry.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record, index) => (
                                    <TableRow key={record.id} className="group transition-colors hover:bg-muted/20">
                                        <TableCell className="text-center text-muted-foreground text-xs">{index + 1}</TableCell>
                                        <TableCell>
                                            {editingId === record.id ? (
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                                                    className="h-8 max-w-[250px] bg-background"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-medium ${!record.is_active ? "text-muted-foreground line-through opacity-60" : "text-foreground"}`}>
                                                        {record.value}
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs font-mono">
                                            {new Date(record.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={() => toggleStatus(record.id, record.is_active)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${record.is_active
                                                    ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
                                                    : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                                                    }`}
                                            >
                                                {record.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-1">
                                                {editingId === record.id ? (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                                            onClick={handleEdit}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                            onClick={() => {
                                                                setEditingId(record.id);
                                                                setEditName(record.value);
                                                            }}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                            onClick={() => handleDelete(record.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
