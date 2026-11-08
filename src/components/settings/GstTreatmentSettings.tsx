import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FileText, Loader2, Download, Edit, Search } from 'lucide-react';
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

interface GstTreatment {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

export function GstTreatmentSettings() {
  const [treatments, setTreatments] = useState<GstTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTreatment, setNewTreatment] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      const { data, error } = await supabase
        .from('gst_treatments')
        .select('*')
        .order('name');

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching GST treatments:', error);
      toast.error('Failed to load GST treatments.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (treatments.length === 0) return;
    const headers = ['Name', 'Description', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...treatments.map(t => `"${t.name}","${t.description}","${t.created_at}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'gst_treatments.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEdit = (treatment: GstTreatment) => {
    setEditingId(treatment.id);
    setNewTreatment({
      name: treatment.name,
      description: treatment.description || '',
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewTreatment({ name: '', description: '' });
  };

  const handleSaveTreatment = async () => {
    if (!newTreatment.name) {
      toast.error('Please fill in Name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: newTreatment.name,
        description: newTreatment.description,
      };

      let data, error;

      if (editingId) {
        // Update
        const result = await supabase
          .from('gst_treatments')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert
        const result = await supabase
          .from('gst_treatments')
          .insert(payload)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (editingId) {
        setTreatments(treatments.map(t => t.id === editingId ? data : t));
        toast.success('GST Treatment updated successfully');
      } else {
        setTreatments([...treatments, data]);
        toast.success('GST Treatment added successfully');
      }

      handleCancel();
    } catch (error: any) {
      console.error('Error saving treatment:', error);
      toast.error('Failed to save treatment: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTreatment = async (id: string) => {
    try {
      const { error } = await supabase.from('gst_treatments').delete().eq('id', id);
      if (error) throw error;

      setTreatments(treatments.filter(t => t.id !== id));
      toast.success('GST Treatment deleted');
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast.error('Failed to delete treatment');
    }
  };

  const filteredTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treatment.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <CardTitle className="text-xl">GST Treatment</CardTitle>
            <CardDescription>Manage GST treatment types</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={treatments.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm" onClick={() => {
              if (isAdding) handleCancel();
              else setIsAdding(true);
            }} variant={isAdding ? "secondary" : "default"}>
              {isAdding ? 'Cancel' : 'Add Treatment'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAdding && (
            <div className="rounded-lg border border-dashed p-6 space-y-4 mb-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{editingId ? 'Edit GST Treatment' : 'New GST Treatment'}</h4>
                <p className="text-sm text-muted-foreground">{editingId ? 'Update existing treatment details.' : 'Define a new GST treatment type.'}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 items-end">
                <div className="space-y-2">
                  <Label>Treatment Name</Label>
                  <Input
                    placeholder="e.g., Registered Business - Regular"
                    value={newTreatment.name}
                    onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Description..."
                    value={newTreatment.description}
                    onChange={(e) => setNewTreatment({ ...newTreatment, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSaveTreatment} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search GST treatments..."
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
                  {filteredTreatments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No GST treatments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTreatments.map((treatment, index) => (
                      <TableRow key={treatment.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{treatment.name}</div>
                          <div className="text-xs text-muted-foreground">{treatment.description}</div>
                        </TableCell>
                        <TableCell>{formatDate(treatment.created_at)}</TableCell>
                        <TableCell>{formatDate(treatment.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEdit(treatment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteTreatment(treatment.id)}
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
