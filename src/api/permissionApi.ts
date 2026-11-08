import { supabase } from "@/supabase/supabaseClient";

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user;
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  return data.session;
};

export const fetchUserPermissions = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_roles")
    .select(`
      role:roles (
        role_permissions (
          permission:permissions (
            module,
            action
          )
        )
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;

  const permissions =
    data?.flatMap((ur: any) =>
      ur.role.role_permissions.map((rp: any) => rp.permission)
    ) ?? [];

  return permissions;
};