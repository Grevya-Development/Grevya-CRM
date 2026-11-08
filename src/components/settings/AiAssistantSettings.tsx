import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLayout } from '@/contexts/LayoutContext';
import { toast } from 'sonner';

export function AiAssistantSettings() {
  const { aiEnabled, setAiEnabled } = useLayout();

  const handleToggle = (checked: boolean) => {
    setAiEnabled(checked);
    if (checked) {
      toast.success('AI assistant has been enabled');
    } else {
      toast('AI assistant has been disabled');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center justify-between">
        AI Assistant Settings
        <Switch checked={aiEnabled} onCheckedChange={handleToggle} />
      </h3>
      <p className="text-sm text-muted-foreground">
        Configure options for the AI assistant here. You can enable features, set
        preferences, or adjust behavior. Use the switch above to turn the assistant
        on or off; when disabled the assistant panel will be hidden throughout the app.
      </p>
    </div>
  );
}
