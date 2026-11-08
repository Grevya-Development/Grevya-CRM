import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../supabase/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Trash2, Edit } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import CreateCategories from './CreateCategories';
import EditCategoryModal from './EditCategoryModal';

interface Category {
  id: string;
  category_name: string;
  created_at: string;
  updated_at: string;
}

const CategoriesTable: React.FC = () => {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setData(categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      // Check if there are products in this category
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (productsError) throw productsError;

      if (products && products.length > 0) {
        toast({
          title: "Cannot delete category",
          description: "There are products associated with this category",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      // Optimistically update the UI
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  // Filter data based on search term
  const filteredData = data.filter(category => 
    category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <CreateCategories onSuccess={fetchCategories} />
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {searchTerm ? 'No matching categories found' : 'No categories available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.category_name}</TableCell>
                  <TableCell>
                    {category.created_at ? format(new Date(category.created_at), 'PPpp') : '-'}
                  </TableCell>
                  <TableCell>
                    {category.updated_at ? format(new Date(category.updated_at), 'PPpp') : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingCategory({ 
                              id: category.id, 
                              name: category.category_name 
                            });
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditCategoryModal
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
          fetchCategories();
        }}
        initialData={editingCategory}
      />
    </div>
  );
};

export default CategoriesTable;