import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CalendarClock, Loader2, Download, Edit, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { supabase } from '@/supabase/supabaseClient';
import { format } from 'date-fns';

interface PaymentTerm {
  id: string;
  name: string;
  description: string;
  days: number;
  created_at: string;
  updated_at?: string;
}

export function PaymentTermsSettings() {
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState({ name: '', description: '', days: '' });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_terms')
        .select('*')
        .order('days', { ascending: true });

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Error fetching payment terms:', error);
      toast.error('Failed to load payment terms. Check if the table exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (terms.length === 0) return;
    const headers = ['Name', 'Description', 'Days', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...terms.map(t => `"${t.name}","${t.description}",${t.days},"${t.created_at}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'payment_terms.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEdit = (term: PaymentTerm) => {
    setEditingId(term.id);
    setNewTerm({
      name: term.name,
      description: term.description || '',
      days: term.days.toString()
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewTerm({ name: '', description: '', days: '' });
  };

  const handleSaveTerm = async () => {
    if (!newTerm.name || !newTerm.days) {
      toast.error('Please fill in Name and Days');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: newTerm.name,
        description: newTerm.description,
        days: parseInt(newTerm.days),
      };

      let data, error;

      if (editingId) {
        // Update
        const result = await supabase
          .from('payment_terms')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert
        const result = await supabase
          .from('payment_terms')
          .insert(payload)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (editingId) {
        setTerms(terms.map(t => t.id === editingId ? data : t));
        toast.success('Payment term updated successfully');
      } else {
        setTerms([...terms, data]);
        toast.success('Payment term added successfully');
      }

      handleCancel();
    } catch (error: any) {
      console.error('Error saving term:', error);
      toast.error('Failed to save payment term: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      const { error } = await supabase.from('payment_terms').delete().eq('id', id);
      if (error) throw error;

      setTerms(terms.filter(t => t.id !== id));
      toast.success('Payment term deleted');
    } catch (error) {
      console.error('Error deleting term:', error);
      toast.error('Failed to delete payment term');
    }
  };

  const filteredTerms = terms.filter(term =>
    term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    term.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd-MM-yyyy hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Payment Terms</CardTitle>
            <CardDescription>Manage payment terms and due dates for invoices</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={terms.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm" onClick={() => {
              if (isAdding) handleCancel();
              else setIsAdding(true);
            }} variant={isAdding ? "secondary" : "default"}>
              {isAdding ? 'Cancel' : 'Add Term'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAdding && (
            <div className="rounded-lg border border-dashed p-6 space-y-4 mb-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{editingId ? 'Edit Payment Term' : 'New Payment Term'}</h4>
                <p className="text-sm text-muted-foreground">{editingId ? 'Update existing payment term details.' : 'Define a new standard payment term.'}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-2">
                  <Label>Term Name</Label>
                  <Input
                    placeholder="e.g., Net 60"
                    value={newTerm.name}
                    onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Payment due in 60 days"
                    value={newTerm.description}
                    onChange={(e) => setNewTerm({ ...newTerm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Days</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={newTerm.days}
                    onChange={(e) => setNewTerm({ ...newTerm, days: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSaveTerm} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? 'Update Term' : 'Save Term'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payment terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">S.No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No payment terms found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTerms.map((term, index) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{term.name}</div>
                          <div className="text-xs text-muted-foreground">{term.description}</div>
                        </TableCell>
                        <TableCell>{formatDate(term.created_at)}</TableCell>
                        <TableCell>{formatDate(term.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEdit(term)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteTerm(term.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
