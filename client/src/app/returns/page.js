import { siteInfo } from "@/lib/site";

export const metadata = {
  title: "Returns & Refund Policy — Kas",
  description: "How returns, exchanges, and refunds work for Kas orders.",
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

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Returns &amp; Refund Policy
      </h1>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        Effective date: August 1, 2026
      </p>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        We want you to be happy with your Kas piece. If something isn&rsquo;t
        right, here&rsquo;s how returns, exchanges, and refunds work.
      </p>

      <Section title="1. Damaged, defective, or wrong items">
        <p>
          If your item arrives damaged, defective, or different from what you
          ordered, contact us within 48 hours of delivery with your order
          number and photos of the item. We will offer a free replacement,
          exchange, or full refund, including any delivery fee paid.
        </p>
      </Section>

      <Section title="2. Change-of-mind returns">
        <p>
          For all other returns, you may request a return within 7 days of
          delivery, provided the item is unused, unworn, and in its original
          condition and packaging. To start a return, contact us with your
          order number.
        </p>
        <p>
          Because many pieces are made to order in small batches, made-to-order
          or customized items are final sale and cannot be returned unless
          they arrive damaged or defective.
        </p>
      </Section>

      <Section title="3. Return shipping">
        <p>
          For change-of-mind returns, the cost of return shipping is the
          customer&rsquo;s responsibility. For damaged, defective, or
          incorrect items, we cover the cost of return shipping.
        </p>
      </Section>

      <Section title="4. Exchanges">
        <p>
          If you&rsquo;d like a different size or color, contact us to check
          availability. Where the item is in stock, we&rsquo;ll arrange an
          exchange once the original item is returned to us in its original
          condition.
        </p>
      </Section>

      <Section title="5. Refunds">
        <p>
          Once your return is received and inspected, we&rsquo;ll notify you
          of the outcome. Approved refunds are issued to your original
          Paystack payment method and typically reflect within 7&ndash;14
          business days, depending on your bank.
        </p>
      </Section>

      <Section title="6. How to request a return">
        <p>
          Email us or use our{" "}
          <a href="/contact" className="text-gold hover:underline">
            contact form
          </a>{" "}
          with your order number and the reason for the return. We&rsquo;ll
          confirm next steps by email.
        </p>
        <ul className="list-none space-y-1">
          <li>
            <a href={`mailto:${siteInfo.email}`} className="hover:text-gold">
              {siteInfo.email}
            </a>
          </li>
          <li>
            <a href={`tel:${siteInfo.phone}`} className="hover:text-gold">
              {siteInfo.phone}
            </a>
          </li>
        </ul>
      </Section>
    </div>
  );
}
