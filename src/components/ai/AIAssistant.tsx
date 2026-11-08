import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Sparkles, TrendingUp, Users, Target, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  context?: 'dashboard' | 'Leads' | 'contacts' | 'general';
}

const quickActions = [
  { icon: TrendingUp, label: 'Analyze pipeline', prompt: 'Analyze my current sales pipeline and suggest improvements' },
  { icon: Users, label: 'Lead scoring', prompt: 'Score my top 5 leads based on engagement and potential' },
  { icon: Target, label: 'Forecast revenue', prompt: 'Provide a revenue forecast for the next quarter' },
  { icon: Lightbulb, label: 'Sales tips', prompt: 'Give me 3 actionable tips to close more Leads this week' },
];

const sampleResponses: Record<string, string> = {
  'Analyze my current sales pipeline and suggest improvements': `Based on your pipeline analysis:

📊 **Current Status:**
- 24 active Leads worth $2.4M
- Average Leads cycle: 45 days
- Win rate: 32%

💡 **Recommendations:**
1. **Focus on Proposal stage** - 8 Leads stuck here for 10+ days. Consider scheduling follow-up calls.
2. **Qualification improvement** - 40% of leads not progressing past Discovery. Review your ICP criteria.
3. **High-value opportunity** - TechCorp Leads ($450K) shows strong engagement. Prioritize this week.`,

  'Score my top 5 leads based on engagement and potential': `🎯 **Lead Scoring Results:**

| Lead | Score | Key Factors |
|------|-------|-------------|
| Acme Corp | 92/100 | 5 website visits, opened 3 emails, budget confirmed |
| TechStart Inc | 87/100 | Demo completed, decision-maker engaged |
| Global Systems | 78/100 | Multiple stakeholders involved, longer timeline |
| DataFlow Ltd | 71/100 | Good fit, needs nurturing |
| CloudFirst | 65/100 | Early stage, high potential |

**Action:** Focus immediate outreach on Acme Corp and TechStart Inc.`,

  'Provide a revenue forecast for the next quarter': `📈 **Q1 2025 Revenue Forecast:**

**Projected Revenue:** $1.8M - $2.2M

**Breakdown:**
- Committed Leads: $850K (high confidence)
- Pipeline weighted: $720K (medium confidence)
- Expected new Leads: $430K (based on historical trends)

**Key Assumptions:**
- 32% win rate maintained
- Average Leads size: $45K
- 12 new qualified leads per month

**Risk Factors:**
- 2 large Leads ($200K+) in late negotiation
- Seasonal Q1 slowdown typical`,

  'Give me 3 actionable tips to close more Leads this week': `🚀 **This Week's Action Plan:**

**1. Re-engage Stalled Leads**
You have 5 Leads with no activity in 7+ days. Send personalized video messages addressing their specific pain points.

**2. Leverage Success Stories**
Your recent TechFlow win is similar to 3 Leads in proposal stage. Share that case study as social proof.

**3. End-of-Quarter Push**
Offer a limited-time implementation bonus for Leads closed by Friday. This creates urgency without discounting.

**Bonus:** Block 2 hours tomorrow for strategic outreach to your top 5 prospects.`,
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ context = 'general' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI sales assistant. I can help you analyze Leads, score leads, forecast revenue, and provide actionable insights. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response = sampleResponses[message] || 
        `I understand you're asking about "${message}". Based on your CRM data, I can see several opportunities for improvement. Would you like me to dive deeper into any specific area like pipeline analysis, lead scoring, or sales forecasting?`;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Sales Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Online
          </Badge>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => handleSend(action.prompt)}
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about your sales..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              disabled={isLoading}
            />
            <Button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
