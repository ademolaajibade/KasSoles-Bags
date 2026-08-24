const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

// Falls back to logging the email when SMTP isn't configured, so the
// forgot-password flow stays usable in local/dev without real credentials.
// In production, an unconfigured SMTP is a hard error rather than a silent
// no-op — users must never see a "check your email" response that sends
// nothing.
async function sendMail({ to, subject, html }) {
  const client = getTransporter();

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured — cannot send email in production");
    }
    console.log(`[mailer] SMTP not configured — would have sent to ${to}:\n  Subject: ${subject}\n  ${html}`);
    return;
  }

  await client.sendMail({ from: process.env.EMAIL_FROM || "no-reply@kas.example", to, subject, html });
}

module.exports = { sendMail };
