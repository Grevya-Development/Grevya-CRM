import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../supabase/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface CreateCategoriesProps {
  onSuccess: () => void;
}

const formSchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
});

type FormValues = z.infer<typeof formSchema>;

const CreateCategories: React.FC<CreateCategoriesProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_name: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .insert([{ category_name: values.category_name }])
        .select();

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Category exists",
            description: "A category with this name already exists",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Category created successfully",
      });
      
      form.reset();
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category_name" className="text-right">
                Name
              </Label>
              <Input
                id="category_name"
                className="col-span-3"
                placeholder="Enter category name"
                {...form.register("category_name")}
                disabled={isLoading}
              />
            </div>
            {form.formState.errors.category_name && (
              <p className="text-sm text-red-500 text-right col-span-4 -mt-3">
                {form.formState.errors.category_name.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategories;