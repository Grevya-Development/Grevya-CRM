import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";
import { AuthLayout, FormMessage } from "@/components/auth/AuthLayout";
import { errorMessage } from "@/components/auth/theme";
import { SubmitButton, TextField } from "@/components/auth/fields";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(errorMessage(err) || "Couldn't send the reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your work email and we'll send you a link to set a new password."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <FormMessage tone="success">
          If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way. Check your inbox and spam folder.
        </FormMessage>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <TextField id="email" label="Work email" type="email" autoComplete="email" placeholder="name@grevya.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <SubmitButton loading={isLoading} loadingText="Sending link…">Send reset link</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
