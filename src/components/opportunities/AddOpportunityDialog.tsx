import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, MapPin, Mic, MicOff, Volume2, SkipForward, Square } from 'lucide-react';
import { useGuidedVoiceInput } from '@/hooks/useGuidedVoiceInput';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface AddOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (opportunity: OpportunityFormData) => void;
}

export interface OpportunityFormData {
  name: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  value: string;
  stage: 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: string;
  expectedCloseDate: string;
  notes: string;
  source: string;
  geoLocation?: { lat: number; lng: number; address: string };
}

const voiceFields = [
  { field: 'name', prompt: 'Please tell me the opportunity name or Leads title', label: 'Opportunity Name' },
  { field: 'company', prompt: 'What is the company name?', label: 'Company' },
  { field: 'contactName', prompt: 'Who is the primary contact name?', label: 'Contact Name' },
  { field: 'contactPhone', prompt: 'What is the contact phone number?', label: 'Phone Number' },
  { field: 'contactEmail', prompt: 'What is the contact email address?', label: 'Email' },
  { field: 'value', prompt: 'What is the estimated Leads value in dollars?', label: 'Leads Value' },
  { field: 'notes', prompt: 'Any additional notes about this opportunity?', label: 'Notes' },
];

export const AddOpportunityDialog: React.FC<AddOpportunityDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [formData, setFormData] = useState<OpportunityFormData>({
    name: '',
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    value: '',
    stage: 'qualification',
    probability: '25',
    expectedCloseDate: '',
    notes: '',
    source: 'direct',
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const {
    isListening,
    currentField,
    transcript,
    isSpeaking,
    startGuidedInput,
    stopGuidedInput,
    skipField,
    isSupported,
    fieldValues,
    progress,
  } = useGuidedVoiceInput();

  // Apply voice values to form
  React.useEffect(() => {
    if (Object.keys(fieldValues).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...fieldValues,
      }));
    }
  }, [fieldValues]);

  const handleGeoTag = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
        setFormData(prev => ({
          ...prev,
          geoLocation: { lat: latitude, lng: longitude, address },
        }));
        toast.success('Location captured successfully');
        setGeoLoading(false);
      },
      () => {
        toast.error('Failed to get location');
        setGeoLoading(false);
      }
    );
  };

  const handleBusinessCardScan = () => {
    setIsScanning(true);
    toast.info('Scanning business card...');
    
    // Simulate business card scanning with OCR
    setTimeout(() => {
      const scannedData: Partial<OpportunityFormData> = {
        contactName: 'Rajesh Kumar',
        contactEmail: 'rajesh.kumar@acmeindia.com',
        contactPhone: '+91 98765 12345',
        company: 'Acme India Pvt Ltd',
        name: 'Acme India - Enterprise Solution',
        value: '250000',
        source: 'business-card',
        notes: 'Scanned from business card at trade show',
      };
      
      setFormData(prev => ({
        ...prev,
        ...scannedData,
      }));
      setIsScanning(false);
      toast.success('Business card scanned and opportunity created!');
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      name: '',
      company: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      value: '',
      stage: 'qualification',
      probability: '25',
      expectedCloseDate: '',
      notes: '',
      source: 'direct',
    });
    onOpenChange(false);
    toast.success('Opportunity added successfully');
  };

  const stageProbabilities: Record<string, string> = {
    qualification: '25',
    proposal: '50',
    negotiation: '75',
    'closed-won': '100',
    'closed-lost': '0',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Opportunity</DialogTitle>
          <DialogDescription>
            Create a new sales opportunity using voice input, business card scan, or manual entry
          </DialogDescription>
        </DialogHeader>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBusinessCardScan}
            disabled={isScanning}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Scan Business Card'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGeoTag} 
            disabled={geoLoading}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            {geoLoading ? 'Getting Location...' : 'Geo-Tag Location'}
          </Button>
          {isSupported && (
            <Button
              variant={isListening ? 'destructive' : 'default'}
              size="sm"
              onClick={() => isListening ? stopGuidedInput() : startGuidedInput(voiceFields)}
              className="gap-2"
            >
              {isListening ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Voice Input
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Guided Voice Input
                </>
              )}
            </Button>
          )}
        </div>

        {/* Voice Input Progress */}
        {(isListening || isSpeaking) && (
          <Card className="p-4 mb-4 border-primary/50 bg-primary/5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSpeaking ? (
                    <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                  ) : isListening ? (
                    <Mic className="h-5 w-5 text-destructive animate-pulse" />
                  ) : null}
                  <span className="font-medium">
                    {isSpeaking ? 'Speaking...' : `Listening for: ${currentField}`}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={skipField} className="gap-1">
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>
              </div>
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Field {progress.current} of {progress.total}
              </p>
              {transcript && (
                <p className="text-sm italic text-muted-foreground">
                  Heard: "{transcript}"
                </p>
              )}
            </div>
          </Card>
        )}

        {formData.geoLocation && (
          <Badge variant="secondary" className="mb-4">
            📍 {formData.geoLocation.address}
          </Badge>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Opportunity Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Enterprise License Leads"
                required
                className={currentField === 'name' ? 'ring-2 ring-primary' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Company *</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company name"
                required
                className={currentField === 'company' ? 'ring-2 ring-primary' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Primary contact"
                className={currentField === 'contactName' ? 'ring-2 ring-primary' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="email@example.com"
                className={currentField === 'contactEmail' ? 'ring-2 ring-primary' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className={currentField === 'contactPhone' ? 'ring-2 ring-primary' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Leads Value (₹) *</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Amount in INR"
                required
                className={currentField === 'value' ? 'ring-2 ring-primary' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select 
                value={formData.stage} 
                onValueChange={(v: any) => setFormData({ 
                  ...formData, 
                  stage: v,
                  probability: stageProbabilities[v] || '25'
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed-won">Closed Won</SelectItem>
                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Probability (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Close Date</Label>
              <Input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Contact</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="campaign">Marketing Campaign</SelectItem>
                  <SelectItem value="trade-show">Trade Show</SelectItem>
                  <SelectItem value="business-card">Business Card Scan</SelectItem>
                  <SelectItem value="cold-call">Cold Call</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details about this opportunity..."
              rows={3}
              className={currentField === 'notes' ? 'ring-2 ring-primary' : ''}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Opportunity</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOpportunityDialog;
