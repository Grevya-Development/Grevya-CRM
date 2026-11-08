import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Building2,
  User,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Edit2,
} from 'lucide-react';
import { Lead } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmailComposer } from '@/components/communication/EmailComposer';

interface MobileLeadsViewProps {
  leads: Lead[];
  onLeadsChange: (leads: Lead[]) => void;
}

const stageColors = {
  'Qualification': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Won': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Lost': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export const MobileLeadsView: React.FC<MobileLeadsViewProps> = ({ leads, onLeadsChange }) => {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);
  const navigate = useNavigate()

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.customers?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || (lead.lead_stage) === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleQuickAction = (action: string, lead: Lead) => {
    switch (action) {
      case 'call':
        toast.info(`Calling ${lead.lead_name}...`);
        window.location.href = `tel:${lead.phone_number}`;
        break;
      case 'email':
        setSelectedLeadForEmail(lead);
        setIsEmailComposerOpen(true);
        break;
      case 'location':
        toast.info(`Opening map for ${lead.customers?.name || 'lead'}...`);
        toast.warning("Location details not available in new lead schema");
        break;
      case 'edit':
        navigate(`/Leads/edit/${lead.id}`, { state: { leadIds: leads.map(l => l.id) } });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Leads..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="Qualification">Qualification</SelectItem>
              <SelectItem value="Won">Won</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Cards */}
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <Sheet key={lead.id}>
              <SheetTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary" style={{ borderLeftColor: stageColors[(lead.lead_stage) as keyof typeof stageColors]?.split(' ')[2]?.replace('border-', '') }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] capitalize px-2 py-0', stageColors[(lead.lead_stage) as keyof typeof stageColors])}
                          >
                            {(lead.lead_stage || '').replace('-', ' ')}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0">
                            {lead.lead_score || 0}/100
                          </Badge>
                        </div>
                        <h3 className="font-bold text-sm truncate">{lead.lead_name}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{lead.customers?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base text-success">{formatCurrency(Number(lead.estimated_deal_value || 0))}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={lead.lead_score || 0} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
                <SheetHeader className="p-6 pb-2">
                  <SheetTitle className="text-xl font-bold">{lead.lead_name}</SheetTitle>
                  <SheetDescription className="text-base">{lead.customers?.name}</SheetDescription>
                </SheetHeader>

                <div className="px-6 pb-10 space-y-6 overflow-y-auto max-h-full no-scrollbar">
                  {/* Quick Actions */}
                  <div className="flex justify-around py-6 border-y bg-muted/20 rounded-xl">
                    <Button variant="ghost" className="flex-col h-auto gap-2 p-2" onClick={() => handleQuickAction('call', lead)}>
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-xs font-medium">Call</span>
                    </Button>
                    <Button variant="ghost" className="flex-col h-auto gap-2 p-2" onClick={() => handleQuickAction('email', lead)}>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium">Email</span>
                    </Button>
                    <Button variant="ghost" className="flex-col h-auto gap-2 p-2" onClick={() => handleQuickAction('location', lead)}>
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-orange-500" />
                      </div>
                      <span className="text-xs font-medium">Map</span>
                    </Button>
                    <Button variant="ghost" className="flex-col h-auto gap-2 p-2" onClick={() => handleQuickAction('edit', lead)}>
                      <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Edit2 className="h-5 w-5 text-purple-500" />
                      </div>
                      <span className="text-xs font-medium">Edit</span>
                    </Button>
                  </div>

                  {/* Leads Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Value</p>
                      <p className="font-bold text-success">{formatCurrency(Number(lead.estimated_deal_value || 0))}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rating/Score</p>
                      <p className="font-bold">{lead.lead_score || 0}/100</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Stage</p>
                      <p className="font-bold capitalize">{(lead.lead_stage || '').replace('-', ' ')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Expected Close</p>
                      <p className="font-bold">{lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : 'Not set'}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-4 rounded-xl border bg-muted/10">
                    <h4 className="font-bold text-sm mb-3">Contact Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{lead.lead_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{lead.customers?.name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 border-t pt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">Not specified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </div>

      {/* Email Composer */}
      {
        selectedLeadForEmail && (
          <EmailComposer
            open={isEmailComposerOpen}
            onOpenChange={setIsEmailComposerOpen}
            module="leads"
            contact={selectedLeadForEmail}
          />
        )
      }
    </div>
  );
};
