import { InputHTMLAttributes, ReactNode, forwardRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "./theme";

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 " +
  "transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:bg-slate-50";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode; // shown at the right of the label (e.g. "Forgot password?")
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(({ label, hint, id, ...props }, ref) => (
  <motion.div variants={fadeUp} className="space-y-1.5">
    <div className="flex items-baseline justify-between">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      {hint}
    </div>
    <input ref={ref} id={id} className={inputClass} {...props} />
  </motion.div>
));
TextField.displayName = "TextField";

export function PasswordField({ label, hint, id, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <motion.div variants={fadeUp} className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
        {hint}
      </div>
      <div className="relative">
        <input id={id} type={visible ? "text" : "password"} className={`${inputClass} pr-11`} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </motion.div>
  );
}

export function SubmitButton({ loading, children, loadingText }: { loading: boolean; children: ReactNode; loadingText: string }) {
  return (
    <motion.button
      variants={fadeUp}
      type="submit"
      disabled={loading}
      whileTap={{ scale: 0.99 }}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {loading ? loadingText : children}
    </motion.button>
  );
}
