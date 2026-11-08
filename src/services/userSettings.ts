import { supabase } from '@/supabase/supabaseClient';

export interface ColumnDefinition {
    id: string;
    label: string;
    visible: boolean;
    isCustom?: boolean;
}

export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    enableEmailTracking?: boolean;
    emailSignature?: string;
    maxRetries?: number;
    retryDelay?: number;
}

export interface UserSettings {
    contact_columns: ColumnDefinition[];
    column_order: string[];
    customer_form_fields?: ColumnDefinition[];
    lead_form_fields?: ColumnDefinition[];
    smtp_config?: SmtpConfig;
}

export const userSettingsService = {
    async getSettings(): Promise<UserSettings | null> {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('user_settings')
                .select('settings')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!error && data?.settings) {
                return data.settings as UserSettings;
            }
        }

        return null;
    },

    async saveSettings(settings: UserSettings): Promise<{ success: boolean; error?: any }> {
        let { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user) {
            const { data: { session } } = await supabase.auth.getSession();
            user = session?.user || null;
        }

        if (!user) {
            console.error('saveSettings: No user found in getUser or getSession', { authError });
            return {
                success: false,
                error: new Error('Auth session missing! Please refresh the page.')
            };
        }

        console.log('Saving settings for user:', user.id);

        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                settings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error saving user settings:', error);
            return { success: false, error };
        }

        return { success: true };
    }
};
