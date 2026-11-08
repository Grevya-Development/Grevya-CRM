import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase/supabaseClient';
import { Customer } from "@/types/index"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Layers
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

import { userSettingsService, ColumnDefinition } from '@/services/userSettings';
import { EmailComposer } from '@/components/communication/EmailComposer';


const statusColors: Record<string, string> = {
  lead: 'bg-info/10 text-info border-info/20',
  prospect: 'bg-warning/10 text-warning border-warning/20',
  customer: 'bg-success/10 text-success border-success/20',
  churned: 'bg-destructive/10 text-destructive border-destructive/20',
};



interface ContactsTableProps {
  contacts: Customer[];
  loading: boolean;
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
  columns: ColumnDefinition[];
  groupBy?: string;
}

export function ContactsTable({ contacts, loading, onUpdate, onDelete, columns, groupBy = 'none' }: ContactsTableProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [selectedContactForEmail, setSelectedContactForEmail] = useState<Customer | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [jumpToPage, setJumpToPage] = useState("");

  // Reset pagination when contacts change (search/filter)
  useEffect(() => {
    setCurrentPage(1);
  }, [contacts]);

  const totalItems = contacts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedContacts = contacts.slice(startIndex, endIndex);

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpToPage("");
    }
  };

  const toLower = (value?: string) => {
    if (!value) return "-";
    return value
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const handleEdit = (customer: Customer) => {
    navigate(`/contacts/edit/${customer.id}`);
  };

  const handleDeleteClick = (contactId: string) => {
    setContactToDelete(contactId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', contactToDelete);

      if (error) throw error;

      onDelete(contactToDelete);
      toast({
        title: 'Success',
        description: 'Customer moved to trash (soft delete)',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };


  const renderCellContent = (contact: any, columnId: string) => {
    switch (columnId) {
      case "name":
        return toLower(contact.name);

      case "email":
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-normal text-foreground hover:text-primary"
            onClick={() => {
              setSelectedContactForEmail(contact);
              setIsEmailComposerOpen(true);
            }}
          >
            {toLower(contact.email)}
          </Button>
        );

      case "mobile_no": {
        const raw = contact.mobile_no || '';
        const digits = raw.replace(/\D/g, '');

        let formatted = raw;
        if (digits.length === 10) {
          formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
          formatted = `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
        } else if (digits.length === 13 && digits.startsWith('091')) {
          formatted = `+91 ${digits.slice(3, 8)} ${digits.slice(8)}`;
        }

        return (
          <span className="font-mono text-sm tracking-wide">
            {formatted || '-'}
          </span>
        );
      }

      case "company":
        return toLower(contact.customer?.name);

      case "designation":
        return toLower(contact.designation);

      case "created_at":
        return new Date(contact.created_at).toLocaleDateString();

      default:
        return contact.custom_fields?.[columnId] ?? "-";
    }
  };

  const renderRow = (contact: Customer) => (
    <TableRow key={contact.id} className="group">
      {columns
        .filter((col) => col.visible)
        .map((col) => (
          <TableCell key={col.id}>
            {renderCellContent(contact, col.id)}
          </TableCell>
        ))}

      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => navigate(`/contacts/view/${contact.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    setSelectedContactForEmail(contact);
                    setIsEmailComposerOpen(true);
                  }}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(contact)} className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(contact.id)}
                      className="text-destructive focus:text-destructive gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>More Actions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );

  if (loading) {
    return <p className="text-muted-foreground">Loading customers...</p>;
  }

  return (
    <>
      <div className="rounded-xl border border-gray-300 bg-card animate-fade-in shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="[&_tr]:border-gray-300/60">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns
                  .filter((col) => col.visible)
                  .map((col) => (
                    <TableHead key={col.id} className="table-header">{col.label}</TableHead>
                  ))}
                <TableHead className="w-[120px] text-left table-header">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {(() => {
                if (groupBy === 'none' || !groupBy) {
                  return paginatedContacts.map((contact) => renderRow(contact));
                }

                // Grouping Logic
                const groups: Record<string, Customer[]> = {};
                paginatedContacts.forEach(contact => {
                  let groupName = 'Unspecified';
                  if (groupBy === 'industry') groupName = (contact.customer as any)?.industry || 'Unspecified';
                  else if (groupBy === 'account_status') groupName = (contact as any).contact_type || 'Active';
                  else if (groupBy === 'priority') groupName = (contact.customer as any)?.priority || 'None';
                  else if (groupBy === 'lead_source') groupName = (contact.customer as any)?.lead_source || 'Unknown';

                  if (!groups[groupName]) groups[groupName] = [];
                  groups[groupName].push(contact);
                });

                return Object.entries(groups).map(([groupName, groupContacts]) => (
                  <React.Fragment key={groupName}>
                    <TableRow className="bg-slate-50/80 border-y border-slate-200">
                      <TableCell colSpan={columns.filter(c => c.visible).length + 1} className="py-2.5 px-4 font-semibold text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-slate-400" />
                          <span className="uppercase tracking-wider">{groupName}</span>
                          <Badge variant="outline" className="text-[10px] ml-1 bg-white border-slate-200 text-slate-500 font-bold">
                            {groupContacts.length} {groupContacts.length === 1 ? 'Customer' : 'Customers'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {groupContacts.map(contact => renderRow(contact))}
                  </React.Fragment>
                ));
              })()}

              {paginatedContacts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.filter((c) => c.visible).length + 1}
                    className="text-center text-muted-foreground py-10"
                  >
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Logic and UI */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-300 bg-slate-50/50">
          <div className="flex-1 flex items-center justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Showing
              {/* Showing <span className="font-semibold text-slate-700">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '} */}
              <span className="font-semibold text-slate-700">{endIndex}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-6">
              <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Go to page</span>
                <Input
                  className="h-8 w-12 text-center p-1 text-sm bg-white"
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  placeholder={currentPage.toString()}
                />
                {/* <span className="text-sm text-slate-500">out of {totalPages || 1}</span> */}
              </form>

              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>First Page</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Previous Page</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex items-center px-4 h-8 rounded-md bg-white border border-gray-300 text-sm font-medium text-slate-700">
                  Page {currentPage} of {totalPages || 1}
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Next Page</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Last Page</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the customer to trash and they will no longer appear in the table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EmailComposer
        open={isEmailComposerOpen}
        onOpenChange={setIsEmailComposerOpen}
        contact={selectedContactForEmail}
        module="customers"
      />
    </>
  );
}
