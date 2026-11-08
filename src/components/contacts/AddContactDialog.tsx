import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mic, MicOff, Camera, MapPin, Loader2, User, Building2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { createWorker } from 'tesseract.js';

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (contact: ContactFormData) => void;
}

export interface ContactFormData {
  type: 'individual' | 'company';
  name: string;
  email: string;
  phone: string;
  mobile: string;
  company: string;
  position: string;
  website: string;
  title: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  notes: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  taxId: string;
  tags: string;
  geoLocation?: { lat: number; lng: number; address: string };
}

export const AddContactDialog: React.FC<AddContactDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    type: 'individual',
    name: '',
    email: '',
    phone: '',
    mobile: '',
    company: '',
    position: '',
    website: '',
    title: '',
    status: 'lead',
    notes: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    taxId: '',
    tags: '',
  });
  const [activeField, setActiveField] = useState<keyof ContactFormData | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useVoiceInput();

  useEffect(() => {
    if (transcript && activeField) {
      setFormData(prev => ({
        ...prev,
        [activeField]: prev[activeField] + transcript,
      }));
      resetTranscript();
    }
  }, [transcript, activeField, resetTranscript]);

  const handleVoiceInput = (field: keyof ContactFormData) => {
    if (isListening) {
      stopListening();
      setActiveField(null);
    } else {
      setActiveField(field);
      startListening();
    }
  };

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
      (error) => {
        toast.error('Failed to get location');
        setGeoLoading(false);
      }
    );
  };

  const handleBusinessCardScan = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG)');
      return;
    }

    setOcrLoading(true);
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const extractedText = ret.data.text;
      // Simple parse for demo - real impl would be more robust
      const lines = extractedText.split('\n');
      const newFormData = { ...formData };
      if (lines[0]) newFormData.name = lines[0];
      setFormData(newFormData);
      
      toast.success('Business card scanned successfully');
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Failed to scan business card');
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      type: 'individual',
      name: '',
      email: '',
      phone: '',
      mobile: '',
      company: '',
      position: '',
      website: '',
      title: '',
      status: 'lead',
      notes: '',
      street: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      taxId: '',
      tags: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Header Actions Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/10">
          <div className="flex gap-2">
             <Button variant="outline" className="text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100">
                New
             </Button>
             <div className="text-sm text-muted-foreground flex items-center">
                Contacts / New
             </div>
          </div>
          <div className='flex gap-2'>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBusinessCardScan} 
                disabled={ocrLoading}
                className="gap-2"
             >
                {ocrLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4"/>}
                Scan Card
             </Button>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGeoTag} 
                disabled={geoLoading}
                className="gap-2"
             >
                <MapPin className="h-4 w-4"/>
                Geo-Checkin
             </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            {/* Top Section */}
            <div className="flex justify-between items-start">
               <div className="space-y-4 flex-1">
                  <RadioGroup 
                      defaultValue="individual" 
                      value={formData.type}
                      onValueChange={(v) => setFormData({...formData, type: v as 'individual' | 'company'})}
                      className="flex gap-6"
                  >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="font-normal cursor-pointer">Individual</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="company" />
                        <Label htmlFor="company" className="font-normal cursor-pointer">Company</Label>
                      </div>
                  </RadioGroup>

                  <div className="flex gap-6 items-start">
                      {/* Avatar Placeholder */}
                      <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors group relative">
                          {formData.type === 'company' ? <Building2 className="h-10 w-10 text-muted-foreground/50"/> : <User className="h-10 w-10 text-muted-foreground/50"/>}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                             <Camera className="h-6 w-6 text-primary/70" />
                          </div>
                      </div>

                      {/* Name Fields */}
                      <div className="flex-1 space-y-3 max-w-2xl">
                          <div>
                            <Input 
                                className="text-3xl font-semibold border-0 border-b rounded-none px-0 h-12 focus-visible:ring-0 placeholder:text-muted-foreground/40"
                                placeholder="e.g. Brandom Freeman"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                          </div>
                          {formData.type === 'individual' && (
                             <div className="flex items-center gap-2">
                                <Input 
                                    className="border-0 border-b rounded-none px-0 h-8 focus-visible:ring-0 max-w-md"
                                    placeholder="Company Name..."
                                    value={formData.company}
                                    onChange={e => setFormData({...formData, company: e.target.value})}
                                />
                             </div>
                          )}
                      </div>
                  </div>
               </div>

               {/* Right Side Status/Indicator (Optional, kept minimal) */}
               <div className="flex gap-2">
                  <div className="flex flex-col items-center gap-1 p-2 border rounded-md">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Meetings</span>
                      <span className="font-bold">0</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 border rounded-md">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Sales</span>
                      <span className="font-bold">0.00</span>
                  </div>
               </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="contacts" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
                <TabsTrigger 
                   value="contacts" 
                   className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                   Contacts & Addresses
                </TabsTrigger>
                <TabsTrigger 
                   value="sales" 
                   className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                   Sales & Purchase
                </TabsTrigger>
                <TabsTrigger 
                   value="invoicing" 
                   className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                   Invoicing
                </TabsTrigger>
                <TabsTrigger 
                   value="notes" 
                   className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                   Internal Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="pt-6">
                 <div className="grid grid-cols-2 gap-12">
                    {/* Left Column: Address */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold text-muted-foreground">Address</Label>
                        
                        <div className="space-y-2">
                           <Input 
                              placeholder="Street..." 
                              className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                              value={formData.street}
                              onChange={e => setFormData({...formData, street: e.target.value})}
                           />
                           <Input 
                              placeholder="Street 2..." 
                              className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                              value={formData.street2}
                              onChange={e => setFormData({...formData, street2: e.target.value})}
                           />
                           <div className="grid grid-cols-3 gap-4">
                              <Input 
                                placeholder="City" 
                                className="col-span-1 border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                              />
                               <Input 
                                placeholder="State" 
                                className="col-span-1 border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.state}
                                onChange={e => setFormData({...formData, state: e.target.value})}
                              />
                               <Input 
                                placeholder="ZIP" 
                                className="col-span-1 border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.zip}
                                onChange={e => setFormData({...formData, zip: e.target.value})}
                              />
                           </div>
                           <Input 
                              placeholder="Country" 
                              className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                              value={formData.country}
                              onChange={e => setFormData({...formData, country: e.target.value})}
                           />
                        </div>

                        <div className="pt-4 space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Tax ID</Label>
                            <Input 
                                placeholder="e.g. BE0477472701" 
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.taxId}
                                onChange={e => setFormData({...formData, taxId: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Right Column: Contact Details */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <Label className="text-muted-foreground">Job Position</Label>
                            <Input 
                                placeholder="e.g. Sales Director"
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.position}
                                onChange={e => setFormData({...formData, position: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <Label className="text-muted-foreground">Phone</Label>
                            <Input 
                                placeholder="+1 123..."
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <Label className="text-muted-foreground">Mobile</Label>
                            <Input 
                                placeholder="+1 987..."
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.mobile}
                                onChange={e => setFormData({...formData, mobile: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <Label className="text-muted-foreground">Email</Label>
                            <Input 
                                placeholder="name@example.com"
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <Label className="text-muted-foreground">Website</Label>
                            <Input 
                                placeholder="e.g. https://www.odoo.com"
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.website}
                                onChange={e => setFormData({...formData, website: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <Label className="text-muted-foreground">Title</Label>
                            <Input 
                                placeholder="e.g. Mister"
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <Label className="text-muted-foreground">Tags</Label>
                            <Input 
                                placeholder="e.g. B2B, VIP"
                                className="border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
                                value={formData.tags}
                                onChange={e => setFormData({...formData, tags: e.target.value})}
                            />
                        </div>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="notes" className="pt-6 h-full">
                  <Textarea 
                      placeholder="Internal notes..."
                      className="min-h-[200px] resize-none border-dashed"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
              </TabsContent>
            </Tabs>

            <input
               type="file"
               ref={fileInputRef}
               className="hidden"
               accept=".jpg, .jpeg, .png"
               onChange={handleFileChange}
            />
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/10 flex justify-between">
           <div className='flex gap-2'>
              <Button type="submit" onClick={handleSubmit}>Save & Close</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Discard</Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
