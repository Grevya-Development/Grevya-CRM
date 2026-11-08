import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/supabase/supabaseClient";
import { AuthLayout, FormMessage } from "@/components/auth/AuthLayout";
import { errorMessage, fadeUp } from "@/components/auth/theme";
import { PasswordField, SubmitButton, TextField } from "@/components/auth/fields";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Upper and lower case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol (@ $ ! % * ? & #)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const passwordOk = PASSWORD_RULES.every((r) => r.test(password));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!passwordOk) return setError("Your password doesn't meet all the requirements below.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() }, // used for the user's CRM profile
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (signUpError) throw signUpError;

      // With email confirmation off, Supabase signs the user in straight away.
      if (data.session) navigate("/dashboard", { replace: true });
      else setSentTo(email.trim());
    } catch (err) {
      const msg = errorMessage(err);
      setError(/already registered|already exists/i.test(msg)
        ? "An account with this email already exists. Try signing in instead."
        : msg || "Couldn't create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a confirmation link to ${sentTo}.`}
        footer={<Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}
      >
        <FormMessage tone="success">
          Open the link in that email to activate your account, then sign in. An administrator will assign your role.
        </FormMessage>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="For Grevya team members. An administrator assigns your role after you join."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSignup} className="space-y-5">
        <TextField id="fullName" label="Full name" autoComplete="name" placeholder="Your name"
          value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
        <TextField id="email" label="Work email" type="email" autoComplete="email" placeholder="name@grevya.com"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordField id="password" label="Password" autoComplete="new-password" placeholder="Create a password"
          value={password} onChange={(e) => setPassword(e.target.value)} required aria-describedby="password-rules" />

        <motion.ul variants={fadeUp} id="password-rules" className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.label} className={`flex items-center gap-2 text-[13px] transition-colors ${met ? "text-emerald-700" : "text-slate-500"}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${met ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>
                  {met && <Check size={11} strokeWidth={3} />}
                </span>
                {rule.label}
              </li>
            );
          })}
        </motion.ul>

        <PasswordField id="confirm" label="Confirm password" autoComplete="new-password" placeholder="Type it again"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

        {error && <FormMessage tone="error">{error}</FormMessage>}
        <SubmitButton loading={isLoading} loadingText="Creating account…">Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default Signup;
