import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadScoring } from '@/components/crm/LeadScoring';
import { ActivityTimeline } from '@/components/crm/ActivityTimeline';
import { DuplicateDetection } from '@/components/crm/DuplicateDetection';
import { WebToLeadForm } from '@/components/crm/WebToLeadForm';
import { AddOpportunityDialog } from '@/components/opportunities/AddOpportunityDialog';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, Star, Activity, Users, Code } from 'lucide-react';

const CRMTools = () => {
  const [opportunityDialogOpen, setOpportunityDialogOpen] = useState(false);

  return (
    <MainLayout>
      <div className="min-h-screen">
        <Header title="CRM Tools" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Advanced CRM features: Lead scoring, activity tracking, duplicate detection, and web forms
            </p>
            <Button onClick={() => setOpportunityDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Opportunity
            </Button>
          </div>

          <Tabs defaultValue="lead-scoring" className="space-y-6">
            <TabsList>
              <TabsTrigger value="lead-scoring" className="gap-2">
                <Star className="h-4 w-4" />
                Lead Scoring
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                Activity Timeline
              </TabsTrigger>
              <TabsTrigger value="duplicates" className="gap-2">
                <Users className="h-4 w-4" />
                Duplicate Detection
              </TabsTrigger>
              <TabsTrigger value="web-forms" className="gap-2">
                <Code className="h-4 w-4" />
                Web-to-Lead Forms
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lead-scoring">
              <LeadScoring />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTimeline />
            </TabsContent>
            <TabsContent value="duplicates">
              <DuplicateDetection />
            </TabsContent>
            <TabsContent value="web-forms">
              <WebToLeadForm />
            </TabsContent>
          </Tabs>
        </div>

        <AddOpportunityDialog
          open={opportunityDialogOpen}
          onOpenChange={setOpportunityDialogOpen}
          onAdd={(opp) => console.log('Added opportunity:', opp)}
        />
      </div>
    </MainLayout>
  );
};

export default CRMTools;
