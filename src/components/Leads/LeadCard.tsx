import { Lead } from "@/types";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Trash2,
  Star,
  Package,
  User,
  Clock,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/supabase/supabaseClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrencyDisplay } from "@/components/currency/CurrencyDisplay";
import { FloatingLabelInput, FloatingLabelTextarea } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermission } from "@/contexts/PermissionContext";

interface LeadsCardProps {
  lead: Lead;
  onLeadUpdate?: (updatedLead: Lead) => void;
  onLeadDelete?: (leadId: string) => void;
  leadIds?: string[];
}

const stageBorderColors: Record<string, string> = {
  'Qualification': "border-l-4 border-l-info",
  "Need Analysis": "border-l-4 border-l-indigo-500",
  "Value Proposition": "border-l-4 border-l-purple-500",
  "Identify Decision Makers": "border-l-4 border-l-primary",
  "Proposal": "border-l-4 border-l-primary",
  "Negotiation": "border-l-4 border-l-warning",
  "Won": "border-l-4 border-l-success",
  "Lost": "border-l-4 border-l-destructive",
};

export function LeadsCard({ lead, onLeadUpdate, onLeadDelete, leadIds }: LeadsCardProps) {
  const { canEdit } = usePermission();
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({
    subject: lead.subject,
    lead_name: lead.lead_name,
    product_interest: lead.product_interest,
    email: lead.email,
    lead_priority: lead.lead_priority,
    industry: lead.industry,
    is_decision_maker: lead.is_decision_maker,
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { confirm } = Modal;

  const handleDelete = () => {
    confirm({
      title: 'Are you sure you want to delete this lead?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Cancel',
      onOk: async () => {
        try {
          if (isMounted.current) setLoading(true);
          const { error } = await supabase
            .from("crm_leads")
            .update({ is_deleted: true })
            .eq("id", lead.id);

          if (error) throw error;

          toast.success("Lead deleted successfully");
          try {
            onLeadDelete?.(lead.id);
          } catch (uiError) {
            console.error("Error updating UI after delete:", uiError);
          }
        } catch (error: any) {
          console.error("Error deleting lead:", error);
          toast.error("Failed to delete lead");
        } finally {
          if (isMounted.current) setLoading(false);
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("crm_leads")
        .update(editedValues)
        .eq("id", lead.id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Lead updated successfully");
      setIsEditing(false);
      onLeadUpdate?.(data as Lead);
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedValues({
      subject: lead.subject,
      lead_name: lead.lead_name,
      product_interest: lead.product_interest,
      email: lead.email,
      lead_priority: lead.lead_priority,
      industry: lead.industry,
      is_decision_maker: lead.is_decision_maker,
    });
    setIsEditing(true);
  };


  if (isEditing) {
    return (
      <div
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white p-3 shadow-lg relative z-20",
          stageBorderColors[lead.lead_stage || ''] || "border-l-4 border-l-slate-400"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Edit Lead</h4>
          <div className="space-y-4 pt-2">
            <FloatingLabelTextarea
              label="Subject/Title"
              value={editedValues.subject || ''}
              onChange={(e) =>
                setEditedValues((prev) => ({ ...prev, subject: e.target.value }))
              }
              required
              className="min-h-[80px]"
            />

            <FloatingLabelInput
              label="Lead Name"
              value={editedValues.lead_name}
              onChange={(e) =>
                setEditedValues((prev) => ({ ...prev, lead_name: e.target.value }))
              }
              required
            />

            <FloatingLabelSelect
              label="Product Interest"
              placeholder="Select Product"
              value={editedValues.product_interest}
              onValueChange={(v) => setEditedValues(prev => ({ ...prev, product_interest: v }))}
              items={[
                { label: "Crm", value: "Crm" },
                { label: "Grevya", value: "Grevya" },
                { label: "Other", value: "Other" },
              ]}
              required
            />

            <FloatingLabelInput
              label="Email"
              validationType="email"
              value={editedValues.email}
              onChange={(e) =>
                setEditedValues((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-500"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-success/90 hover:bg-success text-white"
              onClick={handleSave}
              disabled={loading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/leads/${lead.id}`, { state: { leadIds } })}
      className={cn(
        "w-full h-[105px] rounded-lg border border-slate-200 bg-white p-1.5 cursor-pointer",
        "flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all relative pl-2 pr-4",
        lead.lead_stage === 'Qualification' && 'border-l-[4px] border-l-primary',
        lead.lead_stage === 'Need Analysis' && 'border-l-[4px] border-l-indigo-400',
        lead.lead_stage === 'Value Proposition' && 'border-l-[4px] border-l-purple-400',
        lead.lead_stage === 'Identify Decision Makers' && 'border-l-[4px] border-l-primary',
        lead.lead_stage === 'Proposal' && 'border-l-[4px] border-l-slate-400',
        lead.lead_stage === 'Negotiation' && 'border-l-[4px] border-l-amber-400',
        lead.lead_stage === 'Won' && 'border-l-[4px] border-l-emerald-400',
        lead.lead_stage === 'Lost' && 'border-l-[4px] border-l-rose-400'
      )}
    >
      {/* ───── ROW 1: NAME + AMOUNT ───── */}
      <div className="flex justify-between items-start gap-1 pr-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-1">
            <h4 className="text-[14px] font-extrabold truncate leading-tight">
              {lead.lead_name}
            </h4>
            {lead.is_decision_maker && (
              <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 min-w-0">
                <FileText size={9} className="text-indigo-500 shrink-0" />
                <span className="text-[10px] truncate font-semibold text-slate-500 uppercase tracking-tight">
                  {lead.subject || 'No Subject'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[400px] text-[12px] py-1 px-2">
              <p className="leading-tight">{lead.subject || 'No Subject'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-col items-end shrink-0 gap-0.5">
          <div className="flex items-center gap-1">
            {lead.lead_priority && (
              <span className={cn(
                "text-[8px] px-1 py-0.5 rounded-[3px] font-bold uppercase",
                lead.lead_priority === 'High' ? "bg-red-50 text-red-600" :
                  lead.lead_priority === 'Medium' ? "bg-amber-50 text-amber-600" :
                    "bg-blue-50 text-blue-600"
              )}>
                {lead.lead_priority}
              </span>
            )}
            <CurrencyDisplay
              amount={lead.estimated_deal_value || 0}
              sourceCurrency="INR"
              className="text-[12px] font-extrabold text-success leading-none whitespace-nowrap"
            />
          </div>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap border",
            (lead.lead_score || 0) >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              (lead.lead_score || 0) >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" :
                "bg-rose-50 text-rose-600 border-rose-100"
          )}>
            Score: {lead.lead_score || 0}
          </span>
        </div>
      </div>

      {/* ───── ROW 2: DETAILS GRID ───── */}
      <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail size={9} className="text-blue-500 shrink-0" />
            <span className="text-[10px] truncate font-medium text-slate-600">
              {lead.email}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone size={9} className="text-emerald-500 shrink-0" />
            <span className="text-[10px] font-medium text-slate-600 truncate">
              {lead.phone_number}
            </span>
          </div>
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Package size={9} className="text-orange-500 shrink-0" />
            <span className="text-[10px] truncate font-bold text-slate-700">
              {lead.product_interest || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar size={9} className="text-rose-500 shrink-0" />
            <span className="text-[10px] font-medium text-slate-600 whitespace-nowrap">
              {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString("en-GB") : 'Closing?'}
            </span>
          </div>
        </div>
      </div>

      {/* ───── ROW 3: FOOTER INFO ───── */}
      <div className="flex justify-between items-center mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                size={10}
                className="fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          {lead.lead_owner && (
            <div className="flex items-center gap-1">
              <User size={9} className="text-sky-500" />
              <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter truncate max-w-[80px]">
                {lead.lead_owner.full_name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 shrink-0 whitespace-nowrap">
          <Clock size={9} className="text-amber-500" />
          <span className="text-[9px] font-medium text-slate-500">
            {lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }) : 'New'}
          </span>
        </div>
      </div>

      {/* ───── ACTION MENU (TOP RIGHT FLOAT) ───── */}
      {canEdit("leads") && (
        <div className="absolute top-1.5 right-1.5">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreVertical size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              <DropdownMenuItem className="text-[11px]" onClick={handleEditClick}>
                Quick Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[11px]" onClick={(e) => { e.stopPropagation(); navigate(`/Leads/edit/${lead.id}`); }}>
                Full Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[11px] text-destructive focus:text-destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={11} className="mr-1" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>)}
    </div>
  );
}
