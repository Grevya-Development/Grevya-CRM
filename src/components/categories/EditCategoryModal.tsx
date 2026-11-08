import React, { useEffect } from 'react';
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
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface EditCategoryModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialData: { id: string; name: string } | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type FormValues = z.infer<typeof formSchema>;

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  open,
  onCancel,
  onSuccess,
  initialData,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: FormValues) => {
    if (!initialData) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('categories')
        .update({ 
          category_name: values.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', initialData.id);

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
        description: "Category updated successfully",
      });
      
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                className="col-span-3"
                placeholder="Enter category name"
                {...form.register("name")}
                disabled={isLoading}
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 text-right col-span-4 -mt-3">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;