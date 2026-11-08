import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchUserPermissions } from "@/api/permissionApi";
import { supabase } from "@/supabase/supabaseClient";

type Permission = {
  module: string;
  action: string;
};

type PermissionContextType = {
  hasPermission: (module: string, action: string) => boolean;
  canRead: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  canReadAll: (module: string) => boolean;
  canUpdateAll: (module: string) => boolean;
  canDeleteAll: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
};

export const PermissionActions = {
  CREATE: "Create",
  READ: "Read",
  READ_ALL: "Read_All",
  UPDATE: "Update",
  UPDATE_ALL: "Update_All",
  DELETE: "Delete",
  DELETE_ALL: "Delete_All"
} as const;

const PermissionContext = createContext<PermissionContextType | null>(null);

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      // Signed-out visitors (e.g. on the login page) simply have no permissions.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setPermissions([]);
        return;
      }
      const perms = await fetchUserPermissions(session.user.id);
      setPermissions(perms);
    } catch (err) {
      console.error("Permission load error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadPermissions();
      setLoading(false);
    };
    init();

    // Reload after sign-in / sign-out so buttons match the current user without a page refresh.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadPermissions();
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const permissionMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};

    permissions.forEach(({ module, action }) => {
      const m = module.toLowerCase();
      const a = action;

      if (!map[m]) map[m] = new Set();
      map[m].add(a);
    });

    return map;
  }, [permissions]);

  const hasPermission = (module: string, action: string) =>
    permissionMap[module.toLowerCase()]?.has(action) ?? false;

  const canRead = (module: string) =>
    hasPermission(module, PermissionActions.READ);

  const canCreate = (module: string) =>
    hasPermission(module, PermissionActions.CREATE);

  const canEdit = (module: string) =>
    hasPermission(module, PermissionActions.UPDATE);

  const canDelete = (module: string) =>
    hasPermission(module, PermissionActions.DELETE);

  const canReadAll = (module: string) =>
    hasPermission(module, PermissionActions.READ_ALL);

  const canUpdateAll = (module: string) =>
    hasPermission(module, PermissionActions.UPDATE_ALL);

  const canDeleteAll = (module: string) =>
    hasPermission(module, PermissionActions.DELETE_ALL);

  if (loading) return null;

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        canRead,
        canCreate,
        canEdit,
        canDelete,
        canReadAll, 
        canUpdateAll, 
        canDeleteAll,
        refreshPermissions: loadPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) throw new Error("usePermission must be used inside PermissionProvider");
  return context;
};