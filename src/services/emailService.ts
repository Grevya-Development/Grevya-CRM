import { supabase } from '@/supabase/supabaseClient';
import { userSettingsService, SmtpConfig } from './userSettings';

export interface EmailRecord {
    id?: string;
    user_id?: string;
    contact_id?: string;
    to_email: string;
    cc?: string;
    subject: string;
    body: string;
    status: 'sent' | 'delivered' | 'failed' | 'pending';
    error_message?: string;
    created_at?: string;
    attachments?: any[];
}

export interface EmailConfig {
    id: string;
    label: string;
    from_email: string;
    from_name: string;
    smtp_user: string;
    is_active: boolean;
}

const MAILER_API_URL = import.meta.env.VITE_MAILER_API_URL || 'http://localhost:3001/api';

export const emailService = {
    async sendEmail(email: Omit<EmailRecord, 'status' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Call the crm-mailer backend
            const response = await fetch(`${MAILER_API_URL}/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    to: email.to_email,
                    subject: email.subject,
                    text: email.body.replace(/<[^>]*>/g, ''),
                    html: email.body,
                    cc: email.cc,
                    record_type: email.contact_id ? 'contact' : 'other',
                    record_id: email.contact_id,
                    user_id: session?.user?.id,
                    in_reply_to: (email as any).in_reply_to,
                    references: (email as any).references,
                    attachments: email.attachments
                }),
            });

            const result = await response.json();

            if (result.success) {
                return { success: true };
            } else {
                return { success: false, error: result.error || 'Failed to send email' };
            }
        } catch (err: any) {
            console.error('Email sending failed:', err);
            return { success: false, error: err.message || 'An unexpected error occurred' };
        }
    },

    async getEmailHistory(contactId?: string): Promise<EmailRecord[]> {
        let queryData = supabase
            .from('email_data')
            .select('*')
            .order('created_at', { ascending: false });

        if (contactId) {
            queryData = queryData.eq('contact_id', contactId);
        }

        const { data, error } = await queryData;

        if (error) {
            console.error('Error fetching email history from email_data:', error);
            return [];
        }

        return data as EmailRecord[];
    },

    async updateEmailStatus(id: string, status: EmailRecord['status'], errorMessage?: string): Promise<void> {
        const { error } = await supabase
            .from('email_data')
            .update({ status, error_message: errorMessage })
            .eq('id', id);

        if (error) {
            console.error('Error updating email status:', error);
        }
    },

    async getConfigs(): Promise<EmailConfig[]> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${MAILER_API_URL}/settings`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const result = await response.json();
            return result.data || [];
        } catch (err) {
            console.error('Failed to fetch email configs:', err);
            return [];
        }
    }
};
