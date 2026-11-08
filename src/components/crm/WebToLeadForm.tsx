import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Code,
  Copy,
  Check,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

const defaultFields: FormField[] = [
  { id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
  { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
  { id: 'phone', label: 'Phone Number', type: 'phone', required: false, placeholder: '+91 98765 43210' },
  { id: 'company', label: 'Company Name', type: 'text', required: false, placeholder: 'Your company' },
  { id: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'How can we help?' },
];

export const WebToLeadForm: React.FC = () => {
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [formName, setFormName] = useState('Contact Us');
  const [submitButtonText, setSubmitButtonText] = useState('Submit');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('sales@yourcompany.com');
  const [autoResponder, setAutoResponder] = useState(true);
  const [copied, setCopied] = useState(false);

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: '',
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const generateEmbedCode = () => {
    const fieldsHtml = fields.map(field => {
      let inputHtml = '';
      switch (field.type) {
        case 'textarea':
          inputHtml = `<textarea name="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} rows="4" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;"></textarea>`;
          break;
        case 'select':
          inputHtml = `<select name="${field.id}" ${field.required ? 'required' : ''} style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;">
            <option value="">Select...</option>
            ${(field.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('\n            ')}
          </select>`;
          break;
        default:
          inputHtml = `<input type="${field.type}" name="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;" />`;
      }
      return `    <div style="margin-bottom:16px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">${field.label}${field.required ? ' *' : ''}</label>
      ${inputHtml}
    </div>`;
    }).join('\n');

    return `<!-- Web-to-Lead Form - ${formName} -->
<form id="crm-lead-form" action="https://your-crm.com/api/leads" method="POST" style="max-width:400px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <h3 style="margin:0 0 20px;font-size:20px;font-weight:600;">${formName}</h3>
  
${fieldsHtml}
    
    <input type="hidden" name="source" value="website" />
    <input type="hidden" name="notify_email" value="${notifyEmail}" />
    
    <button type="submit" style="width:100%;padding:12px;background:#0b66f4;color:white;border:none;border-radius:4px;font-weight:500;cursor:pointer;">
      ${submitButtonText}
    </button>
</form>

<script>
document.getElementById('crm-lead-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  try {
    const response = await fetch(this.action, {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      alert('Thank you! We will be in touch soon.');
      this.reset();
      ${redirectUrl ? `window.location.href = '${redirectUrl}';` : ''}
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch (error) {
    alert('Something went wrong. Please try again.');
  }
});
</script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Web-to-Lead Forms</h2>
        <p className="text-muted-foreground">Create embeddable lead capture forms for your website</p>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder" className="gap-2">
            <Settings className="h-4 w-4" />
            Form Builder
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="embed" className="gap-2">
            <Code className="h-4 w-4" />
            Embed Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Form Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Submit Button Text</Label>
                  <Input
                    value={submitButtonText}
                    onChange={(e) => setSubmitButtonText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Redirect URL (optional)</Label>
                  <Input
                    placeholder="https://yoursite.com/thank-you"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notification Email</Label>
                  <Input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-responder</Label>
                  <Switch
                    checked={autoResponder}
                    onCheckedChange={setAutoResponder}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Field Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Form Fields</CardTitle>
                  <Button size="sm" onClick={addField} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-2 cursor-move text-muted-foreground">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(v: any) => updateField(field.id, { type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Placeholder</Label>
                            <Input
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.required}
                                onCheckedChange={(v) => updateField(field.id, { required: v })}
                              />
                              <Label className="text-xs">Required</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>{formName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea placeholder={field.placeholder} rows={4} />
                  ) : field.type === 'select' ? (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((opt, i) => (
                          <SelectItem key={i} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input type={field.type} placeholder={field.placeholder} />
                  )}
                </div>
              ))}
              <Button className="w-full">{submitButtonText}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Embed Code</CardTitle>
                  <CardDescription>Copy and paste this code into your website</CardDescription>
                </div>
                <Button onClick={copyToClipboard} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{generateEmbedCode()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebToLeadForm;
