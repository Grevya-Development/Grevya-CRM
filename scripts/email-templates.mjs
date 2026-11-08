#!/usr/bin/env node
/**
 * Grevya CRM: Supabase Auth email templates.
 *
 *   node scripts/email-templates.mjs build   -> writes supabase/templates/*.html (for review / manual paste)
 *   node scripts/email-templates.mjs apply   -> pushes subjects + templates to the hosted Supabase project
 *
 * `apply` needs, in .env:
 *   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_ACCESS_TOKEN=sbp_...   (Supabase dashboard -> Account -> Access Tokens; keep it secret)
 *
 * Templates use Supabase's Go template variables: {{ .ConfirmationURL }}, {{ .Token }}, {{ .Email }},
 * {{ .NewEmail }}, {{ .SiteURL }} and {{ .Data.full_name }} (user metadata set at sign-up).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "supabase", "templates");
// Served from the live app so email clients that block raw GitHub images still show it.
const LOGO = "https://crm.grevya.com/grevya-logo.png";
const NAVY = "#0B1A3C", BLUE = "#0B64F4", TEXT = "#1F2937", MUTED = "#6B7280", BG = "#F3F5F9";
const BRAND_BAR = ["#F25022", "#FFB900", "#84B900", "#00A3EE"];
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const greeting = `{{ if .Data.full_name }}Hi {{ .Data.full_name }},{{ else }}Hi,{{ end }}`;

const button = (label, href = "{{ .ConfirmationURL }}") => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
  <tr><td style="border-radius:8px;background:${BLUE};">
    <a href="${href}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
  </td></tr>
</table>`;

const linkFallback = (href = "{{ .ConfirmationURL }}") => `
<p style="margin:20px 0 0;font-size:13px;line-height:20px;color:${MUTED};">
  Button not working? Copy this link into your browser:<br>
  <a href="${href}" style="color:${BLUE};word-break:break-all;">${href}</a>
</p>`;

const codeBlock = (code) => `
<div style="margin:24px 0 8px;padding:16px 0;border-radius:8px;background:${BG};text-align:center;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:${NAVY};">${code}</div>`;

function layout({ preheader, heading, body, footerNote }) {
  const bar = BRAND_BAR.map(c => `<td width="25%" style="height:4px;background:${c};font-size:0;line-height:0;">&nbsp;</td>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
      <tr><td style="padding:0 4px 20px;">
        <img src="${LOGO}" width="132" height="48" alt="Grevya" style="display:block;border:0;outline:none;width:132px;height:48px;">
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${bar}</tr></table>
        <div style="padding:36px 36px 32px;font-family:${FONT};color:${TEXT};">
          <h1 style="margin:0 0 18px;font-size:22px;line-height:30px;font-weight:700;color:${NAVY};">${heading}</h1>
          ${body}
        </div>
      </td></tr>
      <tr><td style="padding:20px 4px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">
        ${footerNote}<br>
        Grevya CRM &middot; For Grevya team members only &middot; <a href="{{ .SiteURL }}" style="color:${MUTED};">Open Grevya CRM</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const p = (html) => `<p style="margin:0 0 14px;font-size:15px;line-height:24px;">${html}</p>`;
const ignore = "If you didn't expect this email, you can safely ignore it.";

// key = Supabase config name (mailer_subjects_<key> / mailer_templates_<key>_content)
const TEMPLATES = {
  confirmation: {
    subject: "Confirm your Grevya CRM account",
    html: layout({
      preheader: "Confirm your email to start using Grevya CRM.",
      heading: "Confirm your email",
      body: p(greeting) + p("Welcome to Grevya CRM. Confirm your email address to activate your account.") +
        button("Confirm email") + linkFallback() +
        p(`<span style="font-size:13px;color:${MUTED};">After you sign in, an administrator will assign your role.</span>`),
      footerNote: `This confirmation was requested for {{ .Email }}. ${ignore}`,
    }),
  },
  recovery: {
    subject: "Reset your Grevya CRM password",
    html: layout({
      preheader: "Use this link to choose a new password.",
      heading: "Reset your password",
      body: p(greeting) + p("We received a request to reset the password for your Grevya CRM account. Click below to choose a new one.") +
        button("Set a new password") + linkFallback() +
        p(`<span style="font-size:13px;color:${MUTED};">For your security this link expires soon and can only be used once.</span>`),
      footerNote: `Requested for {{ .Email }}. If you didn't ask to reset your password, ignore this email; your password won't change.`,
    }),
  },
  magic_link: {
    subject: "Your Grevya CRM sign-in link",
    html: layout({
      preheader: "Sign in to Grevya CRM with one click.",
      heading: "Sign in to Grevya CRM",
      body: p(greeting) + p("Click the button below to sign in. No password needed.") + button("Sign in") + linkFallback(),
      footerNote: `Requested for {{ .Email }}. ${ignore}`,
    }),
  },
  invite: {
    subject: "You've been invited to Grevya CRM",
    html: layout({
      preheader: "Accept your invitation to join Grevya CRM.",
      heading: "You're invited to Grevya CRM",
      body: p("Hi,") + p("You've been invited to join the Grevya team on Grevya CRM. Accept the invitation to set up your account.") +
        button("Accept invitation") + linkFallback(),
      footerNote: `This invitation was sent to {{ .Email }}. ${ignore}`,
    }),
  },
  email_change: {
    subject: "Confirm your new email for Grevya CRM",
    html: layout({
      preheader: "Confirm the change of your Grevya CRM email address.",
      heading: "Confirm your new email",
      body: p(greeting) + p("You asked to change your Grevya CRM email from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>. Confirm the change below.") +
        button("Confirm new email") + linkFallback(),
      footerNote: `If you didn't request this change, ignore this email and contact an administrator.`,
    }),
  },
  reauthentication: {
    subject: "Your Grevya CRM verification code",
    html: layout({
      preheader: "Your verification code for Grevya CRM.",
      heading: "Confirm it's you",
      body: p(greeting) + p("Enter this code in Grevya CRM to confirm your request:") + codeBlock("{{ .Token }}") +
        p(`<span style="font-size:13px;color:${MUTED};">The code expires shortly. Never share it with anyone.</span>`),
      footerNote: `Requested for {{ .Email }}. ${ignore}`,
    }),
  },
  // Security notices (only applied if the project supports them).
  password_changed_notification: {
    notice: true,
    subject: "Your Grevya CRM password was changed",
    html: layout({
      preheader: "The password on your Grevya CRM account was just changed.",
      heading: "Your password was changed",
      body: p(greeting) + p("The password for your Grevya CRM account (<strong>{{ .Email }}</strong>) was just changed.") +
        p("If this was you, there's nothing else to do. If it wasn't, reset your password right away and tell an administrator."),
      footerNote: "You're receiving this security notice because of a change to your account.",
    }),
  },
  email_changed_notification: {
    notice: true,
    subject: "Your Grevya CRM email address was changed",
    html: layout({
      preheader: "The email on your Grevya CRM account was changed.",
      heading: "Your email address was changed",
      body: p(greeting) + p("The email address on your Grevya CRM account was changed to <strong>{{ .Email }}</strong>.") +
        p("If you didn't make this change, contact an administrator immediately."),
      footerNote: "You're receiving this security notice because of a change to your account.",
    }),
  },
};

function build() {
  mkdirSync(OUT, { recursive: true });
  const subjects = {};
  for (const [key, t] of Object.entries(TEMPLATES)) {
    writeFileSync(join(OUT, `${key}.html`), t.html);
    subjects[key] = t.subject;
  }
  writeFileSync(join(OUT, "subjects.json"), JSON.stringify(subjects, null, 2) + "\n");
  console.log(`Wrote ${Object.keys(TEMPLATES).length} templates to supabase/templates/`);
}

function readEnv() {
  const env = {};
  for (const line of readFileSync(join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function apply() {
  const env = readEnv();
  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = (env.VITE_SUPABASE_URL || "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!token) throw new Error("Add SUPABASE_ACCESS_TOKEN=sbp_... to .env first.");
  if (!ref) throw new Error("VITE_SUPABASE_URL in .env doesn't look like https://<ref>.supabase.co");

  const api = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const current = await fetch(api, { headers });
  if (!current.ok) throw new Error(`Couldn't read auth config (${current.status}): ${await current.text()}`);
  const config = await current.json();

  const patch = {};
  const skipped = [];
  for (const [key, t] of Object.entries(TEMPLATES)) {
    const subjectKey = `mailer_subjects_${key}`;
    const contentKey = `mailer_templates_${key}_content`;
    if (!(subjectKey in config) || !(contentKey in config)) { skipped.push(key); continue; }
    patch[subjectKey] = t.subject;
    patch[contentKey] = t.html;
    // Security notices are off by default; switch on the ones we've designed.
    const enableKey = `mailer_notifications_${key.replace(/_notification$/, "")}_enabled`;
    if (t.notice && enableKey in config) patch[enableKey] = true;
  }

  const res = await fetch(api, { method: "PATCH", headers, body: JSON.stringify(patch) });
  if (!res.ok) throw new Error(`Update failed (${res.status}): ${await res.text()}`);
  console.log(`Updated ${Object.keys(TEMPLATES).length - skipped.length} email templates on project ${ref}.`);
  if (skipped.length) console.log(`Not available on this project (skipped): ${skipped.join(", ")}`);
  console.log(`Site URL is currently: ${config.site_url || "(not set)"}`);
  console.log(`Allowed redirect URLs: ${config.uri_allow_list || "(none)"}`);
}

const cmd = process.argv[2];
if (cmd === "build") build();
else if (cmd === "apply") { build(); apply().catch(e => { console.error(e.message); process.exit(1); }); }
else { console.log("Usage: node scripts/email-templates.mjs build|apply"); process.exit(1); }
