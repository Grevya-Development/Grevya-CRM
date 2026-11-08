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

/**
 * Company details shown in Settings → Company.
 * NOTE: stored per user (inside that user's user_settings row) for now;
 * there is no organisation-wide settings table yet.
 */
export interface CompanySettings {
    name?: string;
    industry?: string;
    website?: string;
    address?: string;
}

export interface UserSettings {
    contact_columns: ColumnDefinition[];
    column_order: string[];
    customer_form_fields?: ColumnDefinition[];
    lead_form_fields?: ColumnDefinition[];
    smtp_config?: SmtpConfig;
    company?: CompanySettings;
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
    },

    /**
     * Merge `patch` into the user's existing settings and save.
     * Reads the current row first so other keys (contact_columns, smtp_config, ...) are kept.
     * If the read fails we do NOT write, so a transient error can't wipe existing settings.
     */
    async updateSettings(patch: Partial<UserSettings>): Promise<{ success: boolean; error?: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: new Error('Auth session missing! Please refresh the page.') };
        }

        const { data, error } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            return { success: false, error };
        }

        const existing = (data?.settings as UserSettings | null) ?? { contact_columns: [], column_order: [] };
        return userSettingsService.saveSettings({ ...existing, ...patch });
    }
};
