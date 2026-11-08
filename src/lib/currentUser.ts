import { supabase } from "@/supabase/supabaseClient";

/**
 * Display name of the signed-in user, for "performed by" fields in activity logs.
 * Uses the profile's full name, then the email, so logs show who actually acted.
 */
export async function getCurrentUserName(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Unknown user";

    const { data: profile } = await supabase
        .from("crm_profile")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

    return profile?.full_name?.trim() || user.email || "Unknown user";
}
