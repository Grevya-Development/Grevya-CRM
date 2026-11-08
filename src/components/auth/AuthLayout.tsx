import { ReactNode } from "react";
import { motion } from "framer-motion";
import { BRAND, fadeUp } from "./theme";

const brandBar = [BRAND.red, BRAND.amber, BRAND.green, BRAND.blue];

export function BrandBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-1.5 ${className}`} aria-hidden="true">
      {brandBar.map((c) => (
        <span key={c} className="h-1 w-7 rounded-full" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared shell for sign-in, sign-up and password pages: navy brand panel + form panel. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      {/* Brand panel (desktop) */}
      <aside
        className="relative hidden lg:flex lg:w-[52%] xl:w-[56%] flex-col justify-between overflow-hidden p-12"
        style={{ backgroundColor: BRAND.navy }}
      >
        <img src="/grevya-logo-white.png" alt="Grevya" className="relative z-10 h-11 w-auto self-start" />

        {/* Large mark, cropped off the corner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute -bottom-40 -right-40 w-[640px] select-none"
          aria-hidden="true"
        >
          <img
            src="/grevya-icon.png"
            alt=""
            className="w-full max-w-none animate-[spin_120s_linear_infinite] motion-reduce:animate-none"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 max-w-md"
        >
          <BrandBar className="mb-6" />
          <h1 className="font-['Instrument_Sans'] text-5xl font-semibold leading-[1.05] tracking-tight text-white">
            Grevya CRM
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Customers, leads, quotations and invoices for the Grevya team.
          </p>
        </motion.div>

        <p className="relative z-10 text-sm text-slate-400">For Grevya team members only</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <img src="/grevya-logo.png" alt="Grevya" className="h-9 w-auto" />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="w-full max-w-[400px]"
          >
            <motion.div variants={fadeUp}>
              <h2 className="font-['Instrument_Sans'] text-[28px] font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              {subtitle && <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>}
            </motion.div>

            <div className="mt-8">{children}</div>

            {footer && (
              <motion.div variants={fadeUp} className="mt-8 text-center text-sm text-slate-500">
                {footer}
              </motion.div>
            )}
          </motion.div>
        </div>

        <footer className="flex items-center justify-between px-6 pb-6 text-xs text-slate-400 sm:px-10">
          <span>© {new Date().getFullYear()} Grevya</span>
          <span>Internal use only</span>
        </footer>
      </main>
    </div>
  );
}

/** Inline error/success message shown above a form's submit button. */
export function FormMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3.5 py-2.5 text-sm ${styles}`}
    >
      {children}
    </motion.div>
  );
}
