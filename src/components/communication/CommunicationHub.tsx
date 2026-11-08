import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  MessageSquare,
  Send,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/supabase/supabaseClient';
import { emailService, EmailRecord } from '@/services/emailService';
type HubContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
};

export const CommunicationHub: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState('');
  const [realContacts, setRealContacts] = useState<HubContact[]>([]);
  const [emailData, setEmailData] = useState({ subject: '', body: '' });
  const [smsData, setSmsData] = useState({ message: '' });
  const [whatsappData, setWhatsappData] = useState({ message: '' });
  const [messages, setMessages] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [chatbotMessages, setChatbotMessages] = useState([
    { role: 'bot', content: 'Hello! I\'m your CRM assistant. How can I help you today?' },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: contactsData } = await supabase
          .from('crm_contacts')
          .select('id, name, email, mobile_no, customer:crm_customers(name)')
          .is('deleted_at', null);
        setRealContacts(
          (contactsData || []).map((c: any) => ({
            id: c.id,
            name: c.name || '',
            email: c.email || '',
            phone: c.mobile_no ?? null,
            company: c.customer?.name ?? null,
          }))
        );

        const history = await emailService.getEmailHistory();
        setMessages(history);
      } catch (error) {
        console.error('Error fetching communication data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSendEmail = async () => {
    if (!selectedContact || !emailData.subject || !emailData.body) {
      toast.error('Please fill all fields');
      return;
    }
    const contact = realContacts.find(c => c.id === selectedContact);
    if (!contact) return;

    const result = await emailService.sendEmail({
      contact_id: contact.id,
      to_email: contact.email,
      subject: emailData.subject,
      body: emailData.body,
    });

    if (result.success) {
      toast.success('Email sent successfully');
      setEmailData({ subject: '', body: '' });
      const history = await emailService.getEmailHistory();
      setMessages(history);
    } else {
      toast.error(result.error || 'Failed to send email');
    }
  };

  const handleSendSMS = () => {
    if (!selectedContact || !smsData.message) {
      toast.error('Please fill all fields');
      return;
    }
    toast.info('SMS service is not configured yet');
  };

  const handleSendWhatsApp = () => {
    if (!selectedContact || !whatsappData.message) {
      toast.error('Please fill all fields');
      return;
    }
    toast.info('WhatsApp service is not configured yet');
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    setChatbotMessages([
      ...chatbotMessages,
      { role: 'user', content: chatInput },
    ]);

    setTimeout(() => {
      const responses = [
        'I can help you find that information. Let me search the CRM...',
        'Based on your data, I recommend following up with high-value leads.',
        'Your top 3 Leads by value are: Enterprise License ($150k), Cloud Migration ($220k), and Data Analytics ($180k).',
        'Would you like me to schedule a follow-up task?',
      ];
      setChatbotMessages(prev => [
        ...prev,
        { role: 'bot', content: responses[Math.floor(Math.random() * responses.length)] },
      ]);
    }, 1000);

    setChatInput('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent': return <Clock className="h-4 w-4 text-primary" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Select Contact</Label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a contact" />
              </SelectTrigger>
              <SelectContent>
                {realContacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} - {contact.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="email">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="email" className="gap-1">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="gap-1">
                <Bot className="h-4 w-4" />
                Chatbot
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="Email subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  placeholder="Email content..."
                  rows={5}
                />
              </div>
              <Button onClick={handleSendEmail} className="w-full gap-2">
                <Send className="h-4 w-4" />
                Send Email
              </Button>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Message (160 characters max)</Label>
                <Textarea
                  value={smsData.message}
                  onChange={(e) => setSmsData({ message: e.target.value.slice(0, 160) })}
                  placeholder="SMS message..."
                  rows={3}
                  maxLength={160}
                />
              </div>
              <Button onClick={handleSendSMS} className="w-full gap-2">
                <Send className="h-4 w-4" />
                Send SMS
              </Button>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={whatsappData.message}
                  onChange={(e) => setWhatsappData({ message: e.target.value })}
                  placeholder="WhatsApp message..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSendWhatsApp} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4" />
                Send WhatsApp
              </Button>
            </TabsContent>

            <TabsContent value="chatbot" className="mt-4">
              <div className="border rounded-lg h-64 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {chatbotMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border'
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask me anything about your CRM..."
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                />
                <Button onClick={handleChatSubmit}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8">No email history found</p>
            )}
            {messages.map(message => (
              <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">email</Badge>
                    {getStatusIcon(message.status)}
                  </div>
                  <p className="text-sm font-medium truncate">{message.to_email}</p>
                  <p className="text-sm text-muted-foreground truncate">{message.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
