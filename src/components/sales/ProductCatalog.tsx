import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Loader2, Filter, Package, CheckCircle, PauseCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/supabaseClient';
import { Pagination } from 'antd';
import 'antd/dist/reset.css';
import { Product, Category, ProductFormData } from '@/types';
import { StatCard } from './StatCard';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusColors = {
  active: 'bg-green-50 text-green-800',
  inactive: 'bg-yellow-50 text-yellow-800',
  discontinued: 'bg-red-50 text-red-800'
};

const ITEMS_PER_PAGE = 5;

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Form & Selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '', sku: '', description: '', category_id: 0, base_price: '' as string | number, status: 'active'
  });

  const [stats, setStats] = useState({
    total: 0, active: 0, inactive: 0, discontinued: 0
  });

  const updateStats = (currentProducts: Product[]) => {
    setStats({
      total: currentProducts.length,
      active: currentProducts.filter(p => p.status === 'active').length,
      inactive: currentProducts.filter(p => p.status === 'inactive').length,
      discontinued: currentProducts.filter(p => p.status === 'discontinued').length,
    });
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true); setIsLoadingStats(true);
        const [productsRes, categoriesRes] = await Promise.all([
          supabase.from('products').select('*, categories:category_id(category_name)').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('category_name')
        ]);

        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;

        const formattedProducts = productsRes.data.map(p => ({
          ...p,
          category_name: p.categories?.category_name
        }));

        setProducts(formattedProducts);
        setCategories(categoriesRes.data || []);
        updateStats(formattedProducts);

        if (categoriesRes.data?.length > 0) {
          setFormData(prev => ({ ...prev, category_id: categoriesRes.data[0].id }));
        }
      } catch (error) {
        console.error('Error:', error);
        toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
      } finally {
        setIsLoading(false); setIsLoadingStats(false);
      }
    };
    fetchInitialData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, base_price: Number(formData.base_price) || 0 };
      let result;

      if (selectedProduct) {
        result = await supabase.from('products').update(payload).eq('id', selectedProduct.id).select('*, categories:category_id(category_name)').single();
      } else {
        result = await supabase.from('products').insert([payload]).select('*, categories:category_id(category_name)').single();
      }

      if (result.error) throw result.error;

      const newProduct = { ...result.data, category_name: result.data.categories?.category_name };

      const newProducts = selectedProduct
        ? products.map(p => p.id === selectedProduct.id ? newProduct : p)
        : [newProduct, ...products];

      setProducts(newProducts);
      updateStats(newProducts);
      setIsDialogOpen(false);
      toast({ title: 'Success', description: `Product ${selectedProduct ? 'updated' : 'added'} successfully` });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
      updateStats(newProducts);
      toast({ title: 'Success', description: 'Product deleted' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number) => `₹ ${Number(amount).toFixed(2)}`;

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category_id: product.category_id,
      base_price: product.base_price,
      status: product.status
    });
    setIsDialogOpen(true);
  };

  const exportToExcel = () => {
    const dataToExport = filteredProducts.map(p => ({
      Name: p.name,
      SKU: p.sku,
      Category: p.category_name || 'N/A',
      Price: p.base_price,
      Status: p.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'product_catalog.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Product Catalog', 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Name", "SKU", "Category", "Price", "Status"];
    const tableRows = filteredProducts.map(p => [
      p.name,
      p.sku,
      p.category_name || 'N/A',
      `Rs. ${Number(p.base_price).toFixed(2)}`,
      p.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] }
    });

    doc.save('product_catalog.pdf');
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your products inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            Export Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            Export PDF
          </Button>
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setFormData(prev => ({ ...prev, name: '', sku: '', description: '', base_price: '', status: 'active' }));
              setIsDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={stats.total} icon={Package} isLoading={isLoadingStats} className="bg-blue-50/50 border-blue-100" />
        <StatCard title="Active Products" value={stats.active} icon={CheckCircle} isLoading={isLoadingStats} className="bg-green-50/50 border-green-100" />
        <StatCard title="Inactive Products" value={stats.inactive} icon={PauseCircle} isLoading={isLoadingStats} className="bg-amber-50/50 border-amber-100" />
        <StatCard title="Discontinued" value={stats.discontinued} icon={Trash2} isLoading={isLoadingStats} className="bg-red-50/50 border-red-100" />
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>{product.category_name || '-'}</TableCell>
                      <TableCell>{formatCurrency(product.base_price)}</TableCell>
                      <TableCell><Badge className={statusColors[product.status]}>{product.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {filteredProducts.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center pt-6">
              <Pagination
                current={currentPage}
                total={filteredProducts.length}
                pageSize={ITEMS_PER_PAGE}
                onChange={page => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                showSizeChanger={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>SKU</Label>
                <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label>Price</Label>
                <Input type="number" step="0.01" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={String(formData.category_id)} onValueChange={v => setFormData({ ...formData, category_id: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{selectedProduct ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductCatalog;