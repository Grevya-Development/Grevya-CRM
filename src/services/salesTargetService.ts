import { supabase } from "@/supabase/supabaseClient";

export interface SalesTarget {
    id: string;
    name: string;
    team_id: string;
    team_name?: string;
    target_type: string;
    target_value: number;
    start_date: string;
    end_date: string;
    period: string;
    status: 'On Track' | 'At Risk' | 'Achieved';
    created_at: string;
    updated_at: string;
    current_value?: number;
    progress?: number;
    manager?: {
        full_name: string;
        avatar_url?: string;
    };
    members?: SalesTargetMember[];
}

export interface SalesTargetMember {
    id: string;
    target_id: string;
    user_id: string;
    full_name: string;
    avatar_url?: string;
    target_value: number;
    achieved_value?: number;
    status?: string;
}

export const salesTargetService = {
    async getSalesTargets(): Promise<SalesTarget[]> {
        const { data, error } = await supabase
            .from('sales_targets')
            .select(`
                *,
                team:sales_teams (
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((target: any) => ({
            ...target,
            team_name: target.team?.name,
            current_value: 0,
            progress: 0
        }));
    },

    async getSalesTargetById(id: string): Promise<SalesTarget> {
        const { data: target, error: targetError } = await supabase
            .from('sales_targets')
            .select(`
                *,
                team:sales_teams (
                    name,
                    manager:crm_profile!sales_teams_manager_id_fkey (
                        full_name,
                        avatar_url
                    )
                ),
                members:sales_target_members (
                    id,
                    user_id,
                    target_value,
                    profile:crm_profile (
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (targetError) throw targetError;

        return {
            ...target,
            team_name: target.team?.name,
            manager: target.team?.manager,
            members: target.members?.map((m: any) => ({
                id: m.id,
                target_id: m.target_id,
                user_id: m.user_id,
                target_value: m.target_value,
                full_name: m.profile?.full_name,
                avatar_url: m.profile?.avatar_url,
                achieved_value: 0,
                status: 'In progress'
            })) || [],
            current_value: 0,
            progress: 0
        };
    },

    async createSalesTarget(targetData: any, memberBreakdown: any[]): Promise<void> {
        const { data: target, error: targetError } = await supabase
            .from('sales_targets')
            .insert({
                name: targetData.name,
                team_id: targetData.team_id,
                target_type: targetData.target_type,
                target_value: targetData.target_value,
                start_date: targetData.start_date,
                end_date: targetData.end_date,
                period: targetData.period,
                status: 'On Track'
            })
            .select()
            .single();

        if (targetError) throw targetError;

        if (memberBreakdown && memberBreakdown.length > 0) {
            const memberRows = memberBreakdown.map(m => ({
                target_id: target.id,
                user_id: m.user_id,
                target_value: m.target_value
            }));

            const { error: membersError } = await supabase
                .from('sales_target_members')
                .insert(memberRows);

            if (membersError) throw membersError;
        }
    },

    async updateSalesTarget(id: string, targetData: any, memberBreakdown: any[]): Promise<void> {
        const { error: targetError } = await supabase
            .from('sales_targets')
            .update({
                name: targetData.name,
                team_id: targetData.team_id,
                target_type: targetData.target_type,
                target_value: targetData.target_value,
                start_date: targetData.start_date,
                end_date: targetData.end_date,
                period: targetData.period,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (targetError) throw targetError;

        const { error: deleteError } = await supabase
            .from('sales_target_members')
            .delete()
            .eq('target_id', id);

        if (deleteError) throw deleteError;

        if (memberBreakdown && memberBreakdown.length > 0) {
            const memberRows = memberBreakdown.map(m => ({
                target_id: id,
                user_id: m.user_id,
                target_value: m.target_value
            }));

            const { error: membersError } = await supabase
                .from('sales_target_members')
                .insert(memberRows);

            if (membersError) throw membersError;
        }
    },

    async updateSalesTargetMember(memberId: string, targetValue: number): Promise<void> {
        const { error } = await supabase
            .from('sales_target_members')
            .update({ target_value: targetValue })
            .eq('id', memberId);

        if (error) throw error;
    }
};
