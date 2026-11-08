import { supabase } from '@/supabase/supabaseClient';
import { EmailCampaign, AudienceSegment, CampaignStatus } from '@/types';
import { toast } from 'sonner';

export const campaignService = {
    async getCampaigns() {
        try {
            const { data, error } = await supabase
                .from('email_campaigns')
                .select('*, segment:audience_segments(*), recipients:campaign_recipients(count)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as any[]).map(c => {
                const manualContactsCount = Array.isArray(c.manual_contacts) ? c.manual_contacts.length : 0;
                const recipientsTableCount = c.recipients?.[0]?.count || 0;
                
                return {
                    ...c,
                    manual_recipient_count: recipientsTableCount || manualContactsCount
                };
            }) as (EmailCampaign & { segment: AudienceSegment, manual_recipient_count: number })[];
        } catch (error: any) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
            return [];
        }
    },

    async getCampaignById(id: string) {
        try {
            const { data, error } = await supabase
                .from('email_campaigns')
                .select('*, segment:audience_segments(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as EmailCampaign & { segment: AudienceSegment };
        } catch (error: any) {
            console.error('Error fetching campaign:', error);
            toast.error('Failed to load campaign details');
            return null;
        }
    },

    async saveCampaign(campaign: Partial<EmailCampaign>) {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('User not authenticated');

            // Deep clone and remove segment and other UI-only fields
            const { segment, ...cleanedCampaign } = campaign as any;

            // Handle virtual segment IDs and empty strings (UUID constraint in DB)
            if (cleanedCampaign.segment_id === 'all_contacts' || cleanedCampaign.segment_id === 'uploaded_contacts' || cleanedCampaign.segment_id === '') {
                cleanedCampaign.segment_id = null;
            }

            if (cleanedCampaign.template_id === '') {
                cleanedCampaign.template_id = null;
            }

            const campaignData = {
                ...cleanedCampaign,
                user_id: userData.user.id,
                updated_at: new Date().toISOString(),
            };

            // Remove id from campaignData for db update/insert
            const { id: _, ...dbData } = campaignData;

            if (campaign.id && campaign.id !== "") {
                const { data, error } = await supabase
                    .from('email_campaigns')
                    .update(dbData)
                    .eq('id', campaign.id)
                    .select()
                    .single();
                if (error) throw error;
                let savedCampaign = data as EmailCampaign;

                const targetStatus = campaign.status || 'draft';

                // 1. Resolve and save recipients first (while campaign is still in its previous state or draft)
                if (targetStatus === 'sending' || targetStatus === 'scheduled') {
                    await this.resolveAndSaveRecipients(savedCampaign.id, userData.user.id, campaign);
                    
                    // 2. ONLY NOW update to the final status
                    const { data: updatedData, error: updateError } = await supabase
                        .from('email_campaigns')
                        .update({ status: targetStatus })
                        .eq('id', savedCampaign.id)
                        .select()
                        .single();
                    
                    if (updateError) throw updateError;
                    savedCampaign = updatedData as EmailCampaign;
                } else if (campaign.manual_contacts?.length) {
                    await this.saveManualRecipients(savedCampaign.id, userData.user.id, campaign.manual_contacts);
                }

                return savedCampaign;
            } else {
                const { data, error } = await supabase
                    .from('email_campaigns')
                    .insert([{ ...dbData, status: 'draft' }])
                    .select()
                    .single();
                if (error) throw error;
                let savedCampaign = data as EmailCampaign;

                const targetStatus = campaign.status || 'draft';

                // 1. Resolve and save recipients first
                if (targetStatus === 'sending' || targetStatus === 'scheduled') {
                    await this.resolveAndSaveRecipients(savedCampaign.id, userData.user.id, campaign);
                    
                    // 2. NOW update to the target status
                    const { data: updatedData, error: updateError } = await supabase
                        .from('email_campaigns')
                        .update({ status: targetStatus })
                        .eq('id', savedCampaign.id)
                        .select()
                        .single();
                        
                    if (updateError) throw updateError;
                    savedCampaign = updatedData as EmailCampaign;
                } else if (campaign.manual_contacts?.length) {
                    await this.saveManualRecipients(savedCampaign.id, userData.user.id, campaign.manual_contacts);
                }

                return savedCampaign;
            }
        } catch (error: any) {
            console.error('Error saving campaign:', error);
            toast.error(error.message || 'Failed to save campaign');
            return null;
        }
    },

    async getSegments() {
        try {
            const { data, error } = await supabase
                .from('audience_segments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as AudienceSegment[];
        } catch (error: any) {
            console.error('Error fetching segments:', error);
            toast.error('Failed to load audience segments');
            return [];
        }
    },

    async saveSegment(segment: Partial<AudienceSegment>) {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('User not authenticated');

            const segmentData = {
                ...segment,
                user_id: userData.user.id,
                updated_at: new Date().toISOString(),
            };

            if (segment.id) {
                const { data, error } = await supabase
                    .from('audience_segments')
                    .update(segmentData)
                    .eq('id', segment.id)
                    .select()
                    .single();
                if (error) throw error;
                return data as AudienceSegment;
            } else {
                const { data, error } = await supabase
                    .from('audience_segments')
                    .insert([segmentData])
                    .select()
                    .single();
                if (error) throw error;
                return data as AudienceSegment;
            }
        } catch (error: any) {
            console.error('Error saving segment:', error);
            toast.error('Failed to save audience segment');
            return null;
        }
    },

    async estimateRecipientCount(filters: any) {
        try {
            let query = supabase
                .from('crm_contacts')
                .select('id', { count: 'exact', head: true })
                .is('deleted_at', null);

            // If we have industry/priority etc filters, we join with crm_customers
            if (filters.industry?.length || filters.priority?.length || filters.lead_source?.length || filters.minRevenue || filters.maxRevenue || filters.account_status) {
                let customerQuery = supabase
                    .from('crm_contacts')
                    .select('id, crm_customers!inner(id, annual_revenue, industry, priority, lead_source, account_status)', { count: 'exact', head: true })
                    .is('deleted_at', null);

                if (filters.industry?.length) customerQuery = customerQuery.in('crm_customers.industry', filters.industry);
                if (filters.priority?.length) customerQuery = customerQuery.in('crm_customers.priority', filters.priority);
                if (filters.lead_source?.length) customerQuery = customerQuery.in('crm_customers.lead_source', filters.lead_source);
                if (filters.account_status) customerQuery = customerQuery.eq('crm_customers.account_status', filters.account_status);
                if (filters.minRevenue) customerQuery = customerQuery.gte('crm_customers.annual_revenue', filters.minRevenue);
                if (filters.maxRevenue) customerQuery = customerQuery.lte('crm_customers.annual_revenue', filters.maxRevenue);

                const { count, error } = await customerQuery;
                if (error) throw error;
                return count || 0;
            }

            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        } catch (error: any) {
            console.error('Error estimating recipient count:', error);
            return 0;
        }
    },

    async getTotalContactCount() {
        return this.estimateRecipientCount({});
    },

    async getAllContacts() {
        try {
            const { data, error } = await supabase
                .from('crm_contacts')
                .select('id, name, email')
                .is('deleted_at', null);

            if (error) throw error;
            return data.map(c => ({ id: c.id, name: c.name, email: c.email }));
        } catch (error: any) {
            console.error('Error fetching all contacts:', error);
            return [];
        }
    },

    async getSegmentContacts(filters: any) {
        try {
            let query = supabase
                .from('crm_contacts')
                .select('id, name, email')
                .is('deleted_at', null);

            // Simple implementation for now - if we have filters, we apply them
            // This mirrors the logic in estimateRecipientCount
            if (filters.industry?.length || filters.priority?.length || filters.lead_source?.length || filters.account_status) {
                let customerQuery = supabase
                    .from('crm_contacts')
                    .select('id, name, email, crm_customers!inner(id, industry, priority, lead_source, account_status)')
                    .is('deleted_at', null);

                if (filters.industry?.length) customerQuery = customerQuery.in('crm_customers.industry', filters.industry);
                if (filters.priority?.length) customerQuery = customerQuery.in('crm_customers.priority', filters.priority);
                if (filters.lead_source?.length) customerQuery = customerQuery.in('crm_customers.lead_source', filters.lead_source);
                if (filters.account_status) customerQuery = customerQuery.eq('crm_customers.account_status', filters.account_status);

                const { data, error } = await customerQuery;
                if (error) throw error;
                return data.map(c => ({ id: c.id, name: c.name, email: c.email }));
            }

            const { data, error } = await query;
            if (error) throw error;
            return data.map(c => ({ id: c.id, name: c.name, email: c.email }));
        } catch (error: any) {
            console.error('Error fetching segment contacts:', error);
            return [];
        }
    },

    async saveManualRecipients(campaignId: string, userId: string, contacts: { id?: string, name: string, email: string }[]) {
        try {
            // First clear existing recipients for this campaign to replace with the new selection
            const { error: deleteError } = await supabase
                .from('campaign_recipients')
                .delete()
                .eq('campaign_id', campaignId)
                .eq('user_id', userId); // Ensure RLS compliance for deletion
            
            if (deleteError) throw deleteError;

            if (!contacts.length) return;

            const recipients = contacts.map(c => ({
                campaign_id: campaignId,
                user_id: userId, // Required for RLS insert
                contact_id: c.id || null,
                email: c.email,
                name: c.name,
                status: 'pending'
            }));

            // Batch inserts in chunks of 500 to prevent payload size errors
            const chunkSize = 500;
            for (let i = 0; i < recipients.length; i += chunkSize) {
                const chunk = recipients.slice(i, i + chunkSize);
                const { error: insertError } = await supabase
                    .from('campaign_recipients')
                    .insert(chunk);
                if (insertError) throw insertError;
            }
        } catch (error: any) {
            console.error('Error saving manual recipients:', error);
            toast.error('Failed to save selected contacts: ' + (error.message || 'Unknown error'));
        }
    },

    async resolveAndSaveRecipients(campaignId: string, userId: string, campaign: any) {
        let contacts: { id?: string; name: string; email: string }[] = [];

        // 1. Determine the source
        if (campaign.segment_id === 'all_contacts' || (!campaign.segment_id && !campaign.manual_contacts?.length)) {
            contacts = await this.getAllContacts();
        } else if (campaign.segment_id === 'uploaded_contacts' || campaign.manual_contacts?.length) {
            contacts = campaign.manual_contacts || [];
        } else if (campaign.segment_id) {
            const { data: segment } = await supabase
                .from('audience_segments')
                .select('filters')
                .eq('id', campaign.segment_id)
                .single();
            
            if (segment) {
                contacts = await this.getSegmentContacts(segment.filters);
            }
        }

        // 2. Save them
        if (contacts.length > 0) {
            await this.saveManualRecipients(campaignId, userId, contacts);
        }
    },

    async getCampaignRecipients(campaignId: string) {
        try {
            const { data, error } = await supabase
                .from('campaign_recipients')
                .select('*')
                .eq('campaign_id', campaignId);

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error fetching campaign recipients:', error);
            return [];
        }
    }
};
