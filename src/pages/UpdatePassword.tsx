import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/supabase/supabaseClient";
import { AuthLayout, FormMessage } from "@/components/auth/AuthLayout";
import { errorMessage } from "@/components/auth/theme";
import { PasswordField, SubmitButton } from "@/components/auth/fields";

/** Landing page for the password-reset email link: lets the user choose a new password. */
const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // The reset link signs the user in via the URL; wait for that session.
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasSession(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(errorMessage(err) || "Couldn't update your password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSession === false) {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="This password reset link is invalid or has already been used."
        footer={<Link to="/forgot-password" className="font-semibold text-primary hover:underline">Send a new link</Link>}
      >
        <FormMessage tone="error">Request a new reset link and open it within an hour.</FormMessage>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a password you haven't used before.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField id="password" label="New password" autoComplete="new-password" placeholder="At least 8 characters"
          value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        <PasswordField id="confirm" label="Confirm new password" autoComplete="new-password" placeholder="Type it again"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <SubmitButton loading={isLoading || hasSession === null} loadingText={hasSession === null ? "Checking link…" : "Saving…"}>
          Save password
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default UpdatePassword;
