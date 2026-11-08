import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { supabase } from "@/supabase/supabaseClient";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Lead {
    id: string;
    lead_name: string;
    company_name: string;
    lead_source: string;
    lead_stage: string;
    email: string;
    lead_score: number;
    estimated_deal_value: number;
    lead_owner_id: string;
    lead_assign_to_id: string;
    created_at: string;
}


export const Leads = () => {

    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            const uid = data.user?.id || null;
            setUserId(uid);

            if (!uid) return;

            // get role
            const { data: roleData } = await supabase
                .from("user_roles")
                .select(`
        roles (
          name
        )
      `)
                .eq("user_id", uid)
                .single()

            if (roleData) {
                const roleName = Array.isArray(roleData.roles)
                    ? roleData.roles?.[0]?.name
                    : (roleData.roles as any)?.name;

                setUserRole(roleName || null);
            }
        };

        getUser();
    }, []);

    useEffect(() => {
        if (!userId || userRole === null) return;

        const fetchLeads = async () => {
            setLoading(true);

            let query = supabase.from("crm_leads").select("*");

            if (userRole !== "Admin" && userRole !== "Super Admin") {
                query = query.or(
                    `lead_owner_id.eq.${userId},lead_assign_to_id.eq.${userId}`
                );
            }

            const { data, error } = await query;

            if (error) {
                toast.error("Failed to fetch leads");
                return;
            }

            if (data) {
                setLeads(data);
                setLoading(false);
            }
        };
        fetchLeads()
    }, [userId, userRole])


    return (
        <div>
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Leads</CardTitle>
                    <CardDescription>
                        {loading ? "Loading..." : `${leads.length} leads`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leads.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    No leads found
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leads.slice(0, 5).map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="flex items-center justify-between p-3 hover:bg-muted/50 bg-gray-200 rounded-lg cursor-pointer transition-colors"
                                            onClick={() => navigate(`/leads/${lead.id}`, { state: { from: "dashboard" } })}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                    {lead.lead_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{lead.lead_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {lead.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(lead.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {leads.length > 5 && (
                                <div
                                    className="text-sm text-primary hover:underline cursor-pointer text-center"
                                    onClick={() => navigate("/leads")}
                                >
                                    View all leads
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};