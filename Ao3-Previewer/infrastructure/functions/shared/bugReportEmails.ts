// SES email templates for bug reports, shared by the CDK stack (which creates them), the
// createBugReport Lambda and scripts/followup.ts (which send them).
//
// SES templates use Handlebars. In HTML parts, {{value}} is HTML-escaped, so user-submitted text
// can't inject markup. Subjects and text parts use {{{value}}} so characters like & and '
// aren't turned into &amp; and &#x27;.

export const SITE_URL = "https://ficformatter.com";

// SES template names are shared across the whole account and region, so the dev stack gets its
// own suffixed copies. Dev emails are also marked in the subject so they're easy to tell apart.
export type EmailEnv = "prod" | "dev";

export type TemplateKey = "notice" | "received" | "followUp";

export function templateNames(env: EmailEnv): Record<TemplateKey, string> {
  const suffix = env === "dev" ? "Dev" : "";
  return {
    notice: `FicFormatterBugReportNotice${suffix}`,
    received: `FicFormatterBugReportReceived${suffix}`,
    followUp: `FicFormatterBugReportFollowUp${suffix}`,
  };
}

// The command to run for a follow-up, shown in the notice email.
export function followUpCommand(env: EmailEnv): string {
  return env === "dev" ? "DEPLOY_ENV=dev npm run followup --" : "npm run followup --";
}

export type FollowUpStatus = "fixed" | "not-a-bug" | "looking-into-it";

// Each follow-up status sets the email's headline and a short standard intro.
export const FOLLOW_UP_STATUSES: Record<FollowUpStatus, { headline: string; intro: string }> = {
  fixed: {
    headline: "Your bug report has been fixed",
    intro: "Thanks again for reporting this. A fix is now live on FicFormatter.",
  },
  "not-a-bug": {
    headline: "An update on your bug report",
    intro:
      "Thanks again for reporting this. I looked into it, and it doesn't look like something " +
      "FicFormatter can change, but here's what I found.",
  },
  "looking-into-it": {
    headline: "I'm looking into your bug report",
    intro: "Thanks again for reporting this. I've started looking into it.",
  },
};

export interface EmailTemplate {
  key: TemplateKey;
  subject: string;
  html: string;
  text: string;
}

// ─── Shared HTML layout ─────────────────────────────────────
// Table-based with inline styles, since many email clients ignore <style> blocks and flexbox.
// Colors and fonts match the site (MUI primary #7b1d1d, Lucida Grande/Verdana).

const BRAND = "#7b1d1d";
const FONT = "'Lucida Grande', Verdana, sans-serif";

function layout(heading: string, body: string, footer: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e2e2;border-radius:8px;overflow:hidden;font-family:${FONT};color:#2a2a2a;">
<tr><td style="background:${BRAND};padding:16px 24px;">
<a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;font-size:18px;font-weight:bold;">FicFormatter</a>
</td></tr>
<tr><td style="padding:24px;">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${BRAND};">${heading}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eeeeee;font-size:12px;line-height:1.5;color:#777777;">
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function paragraph(content: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">${content}</p>`;
}

function referenceBox(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
<tr><td style="background:#faf7f7;border-left:3px solid ${BRAND};padding:12px 16px;font-size:13px;line-height:1.6;">${content}</td></tr>
</table>`;
}

// ─── To the reporter: automatic confirmation ────────────────
// Deliberately doesn't repeat anything the reporter typed. Anyone can enter any address, so
// echoing their note would let a stranger send custom text to someone else from our domain.

const received: EmailTemplate = {
  key: "received",
  subject: "We got your FicFormatter bug report",
  html: layout(
    "Thanks for your bug report!",
    paragraph(
      "Your report came through, along with the HTML and CSS you were working on, so I can see " +
        "exactly what you saw. You don't need to send anything else.",
    ) +
      paragraph(
        "I read every report. If I have questions or a fix, I'll reply to this address. You can " +
          "also reply to this email if you think of anything to add.",
      ) +
      referenceBox("Report ID: <strong>{{reportId}}</strong>") +
      paragraph(`Thanks for helping make FicFormatter better!`),
    "You're receiving this because this address was entered when submitting a bug report on " +
      `<a href="${SITE_URL}" style="color:#777777;">ficformatter.com</a>. If that wasn't you, ` +
      "you can ignore this email.",
  ),
  text: [
    "Thanks for your bug report!",
    "",
    "Your report came through, along with the HTML and CSS you were working on, so I can see " +
      "exactly what you saw. You don't need to send anything else.",
    "",
    "I read every report. If I have questions or a fix, I'll reply to this address. You can " +
      "also reply to this email if you think of anything to add.",
    "",
    "Report ID: {{{reportId}}}",
    "",
    "Thanks for helping make FicFormatter better!",
    "",
    "--",
    "You're receiving this because this address was entered when submitting a bug report on " +
      "ficformatter.com. If that wasn't you, you can ignore this email.",
  ].join("\n"),
};

// ─── To the reporter: follow-up sent by hand ────────────────

const followUp: EmailTemplate = {
  key: "followUp",
  subject: "{{{headline}}}",
  html: layout(
    "{{headline}}",
    paragraph("{{intro}}") +
      "{{#if message}}" +
      `<div style="margin:0 0 16px;font-size:14px;line-height:1.6;white-space:pre-line;">{{message}}</div>` +
      "{{/if}}" +
      referenceBox("Report ID: <strong>{{reportId}}</strong>") +
      paragraph(
        `If anything still looks off, just reply to this email. ` +
          `<a href="${SITE_URL}" style="color:${BRAND};">Open FicFormatter</a>`,
      ),
    "You're receiving this because you submitted a bug report on " +
      `<a href="${SITE_URL}" style="color:#777777;">ficformatter.com</a> and left this address for a reply.`,
  ),
  text: [
    "{{{headline}}}",
    "",
    "{{{intro}}}",
    "",
    "{{#if message}}{{{message}}}",
    "",
    "{{/if}}Report ID: {{{reportId}}}",
    "",
    `If anything still looks off, just reply to this email. ${SITE_URL}`,
    "",
    "--",
    "You're receiving this because you submitted a bug report on ficformatter.com and left this " +
      "address for a reply.",
  ].join("\n"),
};

// ─── To the maintainer: new report notice ───────────────────

function noticeRow(label: string, value: string): string {
  return `<tr>
<td style="padding:6px 12px 6px 0;font-size:13px;color:#777777;vertical-align:top;white-space:nowrap;">${label}</td>
<td style="padding:6px 0;font-size:13px;line-height:1.5;word-break:break-word;">${value}</td>
</tr>`;
}

const notice: EmailTemplate = {
  key: "notice",
  subject: "New bug report: {{{subjectIntent}}}",
  html: layout(
    "New bug report",
    `<p style="margin:0 0 4px;font-size:12px;color:#777777;text-transform:uppercase;letter-spacing:0.05em;">What looks different between AO3 and the preview</p>` +
      referenceBox(`<span style="white-space:pre-line;">{{description}}</span>`) +
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">` +
      noticeRow("Template / intent", "{{intent}}") +
      noticeRow("AO3 site skin", "{{siteSkin}}") +
      noticeRow("Contact", "{{contact}}") +
      noticeRow("Browser", "{{userAgent}}") +
      noticeRow("Viewport", "{{viewport}}") +
      noticeRow("App version", "{{appVersion}}") +
      noticeRow("Size", "{{htmlBytes}} bytes HTML, {{cssBytes}} bytes CSS") +
      noticeRow("Report ID", "{{reportId}}") +
      `</table>` +
      paragraph(
        `<a href="{{codeUrl}}" style="display:inline-block;background:${BRAND};color:#ffffff;` +
          `text-decoration:none;padding:10px 16px;border-radius:4px;font-size:14px;">View the code in S3</a>`,
      ) +
      paragraph(
        `To reply once it's handled: <code style="font-size:12px;">{{followUpCommand}} {{reportId}} fixed "message"</code>`,
      ),
    "{{#if contactEmail}}Replying to this email goes to the reporter.{{else}}The reporter didn't " +
      "leave an email address.{{/if}}",
  ),
  text: [
    "New bug report",
    "",
    "What looks different between AO3 and the preview:",
    "{{{description}}}",
    "",
    "Template / intent: {{{intent}}}",
    "AO3 site skin: {{{siteSkin}}}",
    "Contact: {{{contact}}}",
    "Browser: {{{userAgent}}}",
    "Viewport: {{{viewport}}}",
    "App version: {{{appVersion}}}",
    "Size: {{{htmlBytes}}} bytes HTML, {{{cssBytes}}} bytes CSS",
    "Report ID: {{{reportId}}}",
    "",
    "Code: {{{codeUrl}}}",
    "",
    'To reply once it\'s handled: {{{followUpCommand}}} {{{reportId}}} fixed "message"',
  ].join("\n"),
};

export interface NamedEmailTemplate extends EmailTemplate {
  name: string;
}

export function bugReportEmailTemplates(env: EmailEnv): NamedEmailTemplate[] {
  const names = templateNames(env);
  return [notice, received, followUp].map((template) => ({
    ...template,
    name: names[template.key],
    subject: env === "dev" ? `[Dev] ${template.subject}` : template.subject,
  }));
}
