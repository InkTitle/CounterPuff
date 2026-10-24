import nodemailer from "nodemailer";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { SUPPORT_EMAIL, APP_NAME, BOOK_TITLE } from "./constants";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export type SendResult = {
  sent: boolean;
  reason?: string;
};

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  meta?: Record<string, unknown>;
}): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || SUPPORT_EMAIL;
  if (!smtpConfigured()) {
    await db.insert(emailLogs).values({
      toEmail: opts.to,
      subject: opts.subject,
      status: "not_configured",
      error: "SMTP is not configured. Message was not sent.",
      meta: opts.meta ?? null,
    });
    return { sent: false, reason: "Email delivery is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)." };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"${APP_NAME}" <${from}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? `<pre>${opts.text}</pre>`,
    });
    await db.insert(emailLogs).values({
      toEmail: opts.to,
      subject: opts.subject,
      status: "sent",
      meta: opts.meta ?? null,
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    await db.insert(emailLogs).values({
      toEmail: opts.to,
      subject: opts.subject,
      status: "failed",
      error: message,
      meta: opts.meta ?? null,
    });
    return { sent: false, reason: message };
  }
}

export function registrationEmail(name: string) {
  const subject = `Welcome to ${APP_NAME} — your account is being processed`;
  const text = `Hello ${name},

Thank you for creating a ${APP_NAME} account.

${BOOK_TITLE} is a practical, evidence-informed guide to understanding urges, changing routines, and building a quit plan. The ${APP_NAME} web app is the companion workspace: it helps you keep a personal tobacco profile, use Craving SOS tools, track progress, and read the eBook.

An administrator must activate your account before full dashboard access is available. You will be able to sign in once that review is complete.

This message is a registration confirmation, not medical advice. ${APP_NAME} is educational behavioral support and is not an emergency service.

Support: ${SUPPORT_EMAIL}

— The ${APP_NAME} team
`;
  return { subject, text };
}

export function passwordResetEmail(name: string, resetUrl: string) {
  const subject = `${APP_NAME} password reset`;
  const text = `Hello ${name},

We received a request to reset your ${APP_NAME} password. Open this single-use link within one hour:

${resetUrl}

If you did not ask for this, you can ignore this message. Your password will stay the same.

Support: ${SUPPORT_EMAIL}
`;
  return { subject, text };
}
