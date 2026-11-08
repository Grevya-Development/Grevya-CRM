import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/supabase/supabaseClient";
import { AuthLayout, FormMessage } from "@/components/auth/AuthLayout";
import { errorMessage } from "@/components/auth/theme";
import { PasswordField, SubmitButton, TextField } from "@/components/auth/fields";

// Turn Supabase auth errors into plain language.
function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Check them and try again.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first. Check your inbox for the confirmation link.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  return message || "Couldn't sign you in. Please try again.";
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(friendlyError(errorMessage(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your Grevya work account."
      footer={
        <>
          New to Grevya CRM?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        <TextField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="name@grevya.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          hint={
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          }
        />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <SubmitButton loading={isLoading} loadingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default Login;
