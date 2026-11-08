import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/supabase/supabaseClient";

/** Tracks the Supabase session: undefined while loading, null when signed out. */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return session;
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white" role="status" aria-label="Loading">
      <img src="/grevya-icon.png" alt="" className="h-12 w-12 animate-pulse" />
    </div>
  );
}

/** Only renders its children for signed-in users; everyone else is sent to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();

  if (session === undefined) return <FullPageSpinner />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

/** "/" goes to the dashboard when signed in, otherwise to the login page. */
export function RootRedirect() {
  const session = useSession();
  if (session === undefined) return <FullPageSpinner />;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}
