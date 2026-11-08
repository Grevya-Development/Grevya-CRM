import { supabase } from "@/supabase/supabaseClient";
import { SalesTeam, SalesTeamMember, SalesTeamAuditLog } from "@/types";

export const salesTeamService = {
    async getSalesTeams(): Promise<SalesTeam[]> {
        const { data: teams, error: teamsError } = await supabase
            .from('sales_teams')
            .select(`
                *,
                manager:crm_profile!sales_teams_manager_id_fkey (
                    full_name,
                    avatar_url
                ),
                members:sales_team_members (
                    user_id,
                    crm_profile (
                        full_name,
                        avatar_url
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (teamsError) {
            throw teamsError;
        }

        return (teams || []).map((team: any) => ({
            ...team,
            manager: team.manager ? {
                full_name: team.manager.full_name,
                avatar_url: team.manager.avatar_url
            } : undefined,
            members: team.members?.map((m: any) => ({
                user_id: m.user_id,
                full_name: m.crm_profile?.full_name,
                avatar_url: m.crm_profile?.avatar_url
            })) || []
        }));
    },

    async createSalesTeam(teamData: Partial<SalesTeam>, memberIds: string[]): Promise<SalesTeam> {
        // 1. Create team
        const { data: team, error: teamError } = await supabase
            .from('sales_teams')
            .insert({
                name: teamData.name,
                manager_id: teamData.manager_id,
                status: teamData.status || 'Active'
            })
            .select()
            .single();

        if (teamError) {
            if (teamError.code === '23505') {
                throw new Error('A sales team with this name already exists.');
            }
            throw teamError;
        }

        // 2. Add members
        if (memberIds && memberIds.length > 0) {
            const memberRows = memberIds.map(userId => ({
                team_id: team.id,
                user_id: userId
            }));
            const { error: membersError } = await supabase
                .from('sales_team_members')
                .insert(memberRows);

            if (membersError) {
                throw membersError;
            }
        }

        // 3. Log action
        await this.logAudit(team.id, 'create', { teamData, memberIds });

        return team;
    },

    async updateSalesTeam(teamId: string, teamData: Partial<SalesTeam>, memberIds: string[]): Promise<void> {
        // 1. Update team details
        const { error: teamError } = await supabase
            .from('sales_teams')
            .update({
                name: teamData.name,
                manager_id: teamData.manager_id,
                status: teamData.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', teamId);

        if (teamError) {
            if (teamError.code === '23505') {
                throw new Error('A sales team with this name already exists.');
            }
            throw teamError;
        }

        // 2. Update members (delete and re-insert)
        const { error: deleteError } = await supabase
            .from('sales_team_members')
            .delete()
            .eq('team_id', teamId);

        if (deleteError) {
            throw deleteError;
        }

        if (memberIds && memberIds.length > 0) {
            const memberRows = memberIds.map(userId => ({
                team_id: teamId,
                user_id: userId
            }));
            const { error: membersError } = await supabase
                .from('sales_team_members')
                .insert(memberRows);

            if (membersError) {
                throw membersError;
            }
        }

        // 3. Log action
        await this.logAudit(teamId, 'update', { teamData, memberIds });
    },

    async toggleTeamStatus(teamId: string, status: 'Active' | 'Inactive'): Promise<void> {
        const { error } = await supabase
            .from('sales_teams')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', teamId);

        if (error) throw error;

        await this.logAudit(teamId, status === 'Active' ? 'reactivate' : 'deactivate', { status });
    },

    async logAudit(teamId: string | null, action: string, details: any): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('sales_team_audit_logs')
            .insert({
                team_id: teamId,
                user_id: user.id,
                action,
                details
            });
    },

    async getAllUsers(): Promise<any[]> {
        // Reusing logic from RoleManagement.tsx but as a service
        const { data: authUsers, error: userError } = await supabase.rpc('get_users');
        if (userError) throw userError;

        const { data: profiles, error: profileError } = await supabase
            .from('crm_profile')
            .select('id, full_name, avatar_url');

        if (profileError) throw profileError;

        return authUsers
            .filter((u: any) => profiles.some((p: any) => p.id === u.id))
            .map((u: any) => {
                const profile = profiles.find((p: any) => p.id === u.id);
                return {
                    id: u.id,
                    full_name: profile?.full_name || u.email,
                    email: u.email,
                    avatar_url: profile?.avatar_url || ""
                };
            });
    }
};
