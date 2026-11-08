import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Layers, Loader2, Download, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/supabase/supabaseClient';
import { format } from 'date-fns';

interface Category {
  id: string;
  category_name: string;
  created_at: string;
  updated_at?: string;
}

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ category_name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (categories.length === 0) return;
    const headers = ['Category Name', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...categories.map(c => `"${c.category_name}","${c.created_at}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'categories.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setNewCategory({
      category_name: category.category_name,
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewCategory({ category_name: '' });
  };

  const handleSaveCategory = async () => {
    if (!newCategory.category_name) {
      toast.error('Please enter a Category Name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category_name: newCategory.category_name,
        updated_at: new Date().toISOString()
      };

      let data, error;

      if (editingId) {
        // Update
        const result = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert
        const result = await supabase
          .from('categories')
          .insert({ category_name: newCategory.category_name })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (editingId) {
        setCategories(categories.map(c => c.id === editingId ? data : c));
        toast.success('Category updated successfully');
      } else {
        setCategories([...categories, data]);
        toast.success('Category added successfully');
      }

      handleCancel();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(
        error?.code === '23505'
          ? 'A category with this name already exists'
          : 'Failed to save category: ' + (error.message || 'Unknown error')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      // Check for associated products before deleting
      const { data: products } = await supabase.from('products').select('id').eq('category_id', id).limit(1);
      if (products && products.length > 0) {
        toast.error('Cannot delete category: It contains products.');
        return;
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;

      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Categories</h3>
          <p className="text-sm text-muted-foreground">Manage product categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={categories.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={() => {
            if (isAdding) handleCancel();
            else setIsAdding(true);
          }} variant={isAdding ? "secondary" : "default"}>
            {isAdding ? 'Cancel' : 'Add Category'}
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="mb-6 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{editingId ? 'Edit Category' : 'New Category'}</CardTitle>
            <CardDescription>{editingId ? 'Update existing category details.' : 'Define a new product category.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 items-end">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input
                  placeholder="e.g., Electronics"
                  value={newCategory.category_name}
                  onChange={(e) => setNewCategory({ ...newCategory, category_name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSaveCategory} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Update Category' : 'Save Category'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {categories.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            No categories found. Add one to get started.
          </div>
        )}
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{category.category_name}</p>
                <p className="text-xs text-muted-foreground">Created: {format(new Date(category.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={() => handleEdit(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteCategory(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
