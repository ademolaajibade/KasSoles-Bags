import { siteInfo } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy — Kas",
  description: "How Kas collects, uses, and protects your personal data.",
};

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm text-black/60 dark:text-white/60">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        Effective date: August 1, 2026
      </p>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        This Privacy Policy explains how Kas (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
        uses, shares, and protects your personal information when you visit our
        website or place an order. By using our site, you agree to the
        practices described here.
      </p>

      <Section title="1. Information we collect">
        <p>We collect information you give us directly, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details — name, email address, and password (stored hashed, never in plain text).</li>
          <li>Order and shipping details — full name, phone number, delivery address, and order history.</li>
          <li>Communications — anything you send us through the contact form.</li>
          <li>Reviews — any product review or rating you submit.</li>
        </ul>
        <p>
          We also collect limited technical information automatically, such as
          a guest cart identifier stored in a cookie so your cart persists
          between visits, and a secure session cookie used to keep you signed in.
        </p>
        <p>
          <strong className="text-foreground">Payment information:</strong> we
          do not collect or store your card details. Payments are processed
          directly by Paystack, our payment provider; we only receive
          confirmation that a payment succeeded or failed and a reference
          number.
        </p>
      </Section>

      <Section title="2. How we use your information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To process and fulfil your orders, including shipping and delivery.</li>
          <li>To create and manage your account, including password resets.</li>
          <li>To respond to messages you send through the contact form.</li>
          <li>To send order-related emails (confirmations, payment receipts, password resets).</li>
          <li>To prevent fraud, abuse, and to keep our site secure.</li>
        </ul>
        <p>
          We do not sell your personal information, and we do not send
          marketing emails unless you separately opt in to receive them.
        </p>
      </Section>

      <Section title="3. Who we share information with">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong className="text-foreground">Paystack</strong> — to process payments securely.</li>
          <li><strong className="text-foreground">Cloudinary</strong> — to host product images (this does not involve your personal data).</li>
          <li><strong className="text-foreground">Delivery couriers</strong> — your name, phone number, and address, solely to deliver your order.</li>
        </ul>
        <p>
          We do not share your information with any other third party for
          marketing purposes.
        </p>
      </Section>

      <Section title="4. Data retention">
        <p>
          We retain account and order information for as long as your account
          is active and as needed to comply with our legal and tax
          obligations, resolve disputes, and enforce our agreements. You can
          request deletion of your account at any time (see &ldquo;Your
          rights&rdquo; below), though we may retain order records required
          for accounting purposes.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>
          In line with the Nigeria Data Protection Act (2023), you have the
          right to:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate or incomplete data (via your account profile, or by contacting us).</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Object to or restrict certain uses of your data.</li>
          <li>Withdraw consent to marketing communications at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us using the details below.
        </p>
      </Section>

      <Section title="6. Security">
        <p>
          We use industry-standard measures to protect your data, including
          encrypted password storage, secure (httpOnly) session cookies, and
          encrypted connections (HTTPS). No method of transmission or storage
          is 100% secure, but we work to protect your information using
          commercially reasonable safeguards.
        </p>
      </Section>

      <Section title="7. Children's privacy">
        <p>
          Our site is not directed at children under 18, and we do not
          knowingly collect personal information from children.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page with an updated effective date.
        </p>
      </Section>

      <Section title="9. Contact us">
        <p>
          If you have questions about this Privacy Policy or how your data is
          handled, contact us at:
        </p>
        <ul className="list-none space-y-1">
          <li>{siteInfo.address}</li>
          <li>
            <a href={`tel:${siteInfo.phone}`} className="hover:text-gold">
              {siteInfo.phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${siteInfo.email}`} className="hover:text-gold">
              {siteInfo.email}
            </a>
          </li>
        </ul>
      </Section>
    </div>
  );
}
