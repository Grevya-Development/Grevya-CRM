import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Sparkles, Mail, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const emailTemplates = [
  { id: 'follow-up', name: 'Follow-up Email' },
  { id: 'intro', name: 'Introduction Email' },
  { id: 'proposal', name: 'Proposal Email' },
  { id: 'thank-you', name: 'Thank You Email' },
];

const tones = [
  { id: 'professional', name: 'Professional' },
  { id: 'friendly', name: 'Friendly' },
  { id: 'urgent', name: 'Urgent' },
  { id: 'casual', name: 'Casual' },
];

const sampleOutputs: Record<string, string> = {
  'email-follow-up': `Subject: Quick follow-up on our conversation

Hi [Name],

I wanted to follow up on our discussion last week about [topic]. I've been thinking about your challenges with [pain point], and I believe we can help.

Here are three ways we could add value:
1. Reduce your [metric] by 30% within 90 days
2. Streamline your [process] workflow
3. Provide dedicated support for your team

Would you be available for a 15-minute call this week to explore these options?

Best regards,
[Your name]`,
  'email-proposal': `Subject: Proposal for [Company Name] - Partnership Opportunity

Dear [Name],

Thank you for considering us for your [project] needs. Based on our discussions, I'm pleased to present our tailored proposal.

**Proposed Solution:**
We recommend our Enterprise package, which includes:
• Full platform access for your team
• Dedicated account manager
• Custom integrations
• 24/7 priority support

**Investment:** $X,XXX/month (annual billing)

**Next Steps:**
1. Review the attached detailed proposal
2. Schedule a call to address any questions
3. Begin implementation within 2 weeks

I'm confident this partnership will drive significant results for [Company Name].

Looking forward to your thoughts.

Best,
[Your name]`,
  'proposal': `## Executive Summary

This proposal outlines a comprehensive solution designed to address [Client Name]'s key challenges in [area].

### Current Challenges
- Challenge 1: Description
- Challenge 2: Description
- Challenge 3: Description

### Proposed Solution
Our platform will help you:
1. Achieve X% improvement in [metric]
2. Save X hours per week on [task]
3. Increase [outcome] by X%

### Investment & Timeline
| Phase | Timeline | Investment |
|-------|----------|------------|
| Discovery | Week 1-2 | Included |
| Implementation | Week 3-4 | $X,XXX |
| Training | Week 5 | Included |

### Why Choose Us
- 10+ years of experience
- 500+ successful implementations
- 98% customer satisfaction rate`,
};

export const AIContentGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [template, setTemplate] = useState('follow-up');
  const [tone, setTone] = useState('professional');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const key = activeTab === 'email' ? `email-${template}` : activeTab;
      setOutput(sampleOutputs[key] || sampleOutputs['email-follow-up']);
      setIsGenerating(false);
      toast.success('Content generated successfully!');
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <CardTitle>AI Content Generator</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="proposal" className="gap-2">
              <FileText className="h-4 w-4" />
              Proposal
            </TabsTrigger>
            <TabsTrigger value="message" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proposal" className="mt-4">
            <div className="text-sm text-muted-foreground">
              Generate professional proposals based on Leads context
            </div>
          </TabsContent>

          <TabsContent value="message" className="mt-4">
            <div className="text-sm text-muted-foreground">
              Create quick follow-up messages for any channel
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Context (optional)</Label>
            <Textarea
              placeholder="Add any specific details about the recipient, Leads, or key points to include..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Content</Label>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1">
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-muted border">
                <pre className="text-sm whitespace-pre-wrap font-sans">{output}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
