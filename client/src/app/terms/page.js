import { siteInfo } from "@/lib/site";

export const metadata = {
  title: "Terms of Service — Kas",
  description: "The terms that govern your use of the Kas website and orders.",
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        Effective date: August 1, 2026
      </p>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the
        Kas website and your purchase of any product from us. By placing an
        order or creating an account, you agree to these Terms.
      </p>

      <Section title="1. About us">
        <p>
          Kas sells handmade bags, shoes, and slippers, made in small batches
          in Nigeria. Some pieces are made to order, so listed stock and
          delivery timelines may vary by item.
        </p>
      </Section>

      <Section title="2. Accounts">
        <p>
          You may browse and check out as a guest, or create an account to
          track orders, save a wishlist, and check out faster. You are
          responsible for maintaining the confidentiality of your password
          and for all activity under your account. Notify us immediately if
          you suspect unauthorized use of your account.
        </p>
      </Section>

      <Section title="3. Products and pricing">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            All prices are listed in Nigerian Naira (₦) and are inclusive of
            applicable taxes unless stated otherwise.
          </li>
          <li>
            Because items are handmade, slight variations in color, texture,
            or finish between the product photo and the delivered item are
            normal and are not considered defects.
          </li>
          <li>
            We reserve the right to correct pricing errors, update prices, or
            discontinue a product at any time before an order is placed.
          </li>
          <li>
            Items marked with a sale price remain on sale only while the
            discounted price is displayed at checkout.
          </li>
        </ul>
      </Section>

      <Section title="4. Orders and payment">
        <p>
          Placing an order is an offer to purchase, which we may accept or
          decline (for example, if an item goes out of stock before your
          payment completes). Payments are processed securely by Paystack; we
          do not store your card details. An order is only confirmed once
          payment has been successfully verified.
        </p>
        <p>
          We reserve the right to cancel any order suspected of fraud or
          abuse, in which case any payment received will be refunded.
        </p>
      </Section>

      <Section title="5. Shipping and delivery">
        <p>
          Delivery fees are calculated based on the shipping state provided at
          checkout and shown to you before payment. Delivery timelines are
          estimates and may vary based on courier availability and your
          location; we are not liable for delays caused by the courier or
          circumstances outside our control.
        </p>
      </Section>

      <Section title="6. Returns and refunds">
        <p>
          Our returns and refund process, including timeframes and
          conditions, is set out in our{" "}
          <a href="/returns" className="text-gold hover:underline">
            Returns &amp; Refund Policy
          </a>
          , which forms part of these Terms.
        </p>
      </Section>

      <Section title="7. Reviews and user content">
        <p>
          If you submit a product review, you agree it will be honest,
          relevant, and free of abusive, defamatory, or unlawful content. We
          may moderate or remove reviews that violate this. By submitting a
          review, you grant us a non-exclusive right to display it on our
          site.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          All content on this site — including product photos, text, logos,
          and design — belongs to Kas or its licensors and may not be
          reproduced or used without our written permission.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p>
          To the fullest extent permitted by law, Kas is not liable for any
          indirect, incidental, or consequential loss arising from your use of
          the site or purchase of a product. Our total liability for any claim
          is limited to the amount you paid for the relevant order.
        </p>
      </Section>

      <Section title="10. Governing law">
        <p>
          These Terms are governed by the laws of the Federal Republic of
          Nigeria. Any disputes will be subject to the exclusive jurisdiction
          of the Nigerian courts.
        </p>
      </Section>

      <Section title="11. Changes to these Terms">
        <p>
          We may update these Terms from time to time. Continued use of the
          site after a change means you accept the updated Terms.
        </p>
      </Section>

      <Section title="12. Contact us">
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
