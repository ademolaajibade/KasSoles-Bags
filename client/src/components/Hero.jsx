import Link from "next/link";
import Image from "next/image";

export default function Hero({
  eyebrow = "Handcrafted in small batches",
  title = (
    <>
      Bags, sandals &amp; slides made by hand
    </>
  ),
  subtitle = "Every piece is cut, stitched and finished by hand — made to last, made to order.",
  image,
  primaryCta = { href: "/products", label: "Shop all" },
  secondaryCta = { href: "/products?gender=female", label: "Women’s edit" },
}) {
  return (
    <section className="mb-10 grid min-h-[70vh] items-center gap-10 md:grid-cols-2 md:gap-16">
      <div>
        <p className="text-sm font-medium text-gold">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-black/60 dark:text-white/60">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {primaryCta && (
            <Link
              href={primaryCta.href}
              className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-black hover:opacity-90"
            >
              {primaryCta.label}
            </Link>
          )}
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="rounded-full border border-gold/15 px-6 py-3 text-sm font-medium hover:bg-gold/10"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>

      <div className="relative aspect-4/3 h-full min-h-[50vh] w-full min-w-0 overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg tracking-tight text-black/30 dark:text-white/30">
            <Image src="/logo.jpeg" alt="logo" width={80} height={80} />
            <span className="">Kas</span>
          </div>
        )}
      </div>
    </section>
  );
}
