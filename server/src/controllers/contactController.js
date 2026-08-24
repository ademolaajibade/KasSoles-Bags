const asyncHandler = require("express-async-handler");
const { sendMail } = require("../utils/mailer");

// POST /api/contact
const sendContactMessage = asyncHandler(async (req, res) => {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim();
  const message = (req.body.message || "").trim();

  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Name, email and message are required");
  }

  await sendMail({
    to: process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || "hello@kas.example",
    subject: `New contact message from ${name}`,
    html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, "<br>")}</p>`,
  });

  res.json({ success: true, message: "Thanks for reaching out — we'll get back to you soon." });
});

module.exports = { sendContactMessage };
