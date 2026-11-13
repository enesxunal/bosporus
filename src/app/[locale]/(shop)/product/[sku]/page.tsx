import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySku, getCategoryBySlug } from "@/lib/products";
import { ProductDetailView } from "@/components/b2c/ProductDetailView";
import { isPaymentTestSku } from "@/lib/payment-test-product";
import { productJsonLd, productMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { getVerifiedProductContent } from "@/lib/product-seo-content";
import { RATGEBER_ARTICLES } from "@/lib/ratgeber";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; sku: string }>;
}): Promise<Metadata> {
  const { locale, sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) return { title: "Produkt" };
  return productMetadata(product, locale);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; sku: string }>;
}) {
  const { locale, sku } = await params;
  setRequestLocale(locale);

  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) notFound();

  const isTest = isPaymentTestSku(product.sku);
  const jsonLd = isTest ? null : productJsonLd(product, locale);

  const category = product.category_slug ? getCategoryBySlug(product.category_slug) : undefined;
  const verifiedContent = getVerifiedProductContent(product.sku);
  const relatedGuides = RATGEBER_ARTICLES.filter((article) =>
    article.relatedProductSkus.includes(product.sku)
  ).slice(0, 2);
  const breadcrumbItems = [
    { name: "Startseite", href: "/" },
    { name: "Produkte", href: "/products" },
    ...(category
      ? [{ name: category.name_de, href: `/products/${category.slug}` }]
      : []),
    { name: product.name_de.trim() },
  ];

  return (
    <>
      {!isTest && <Breadcrumbs items={breadcrumbItems} />}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailView product={product} />
      {verifiedContent && product.is_active && locale === "de" && (
        <section className="page-container pb-8 sm:pb-12" aria-label="Produktinformationen">
          <div className="rounded-2xl border border-bosporus-gray-100 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-extrabold text-bosporus-gray-800 mb-3">
              Hinweise zu diesem Artikel
            </h2>
            <p className="max-w-4xl text-sm leading-7 text-bosporus-muted">
              {verifiedContent.detail}
            </p>
            {relatedGuides.length > 0 && (
              <div className="mt-5 border-t border-bosporus-gray-100 pt-4">
                <h3 className="font-bold text-bosporus-gray-800 mb-2">Passende Einkaufsratgeber</h3>
                <ul className="flex flex-wrap gap-3">
                  {relatedGuides.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/ratgeber/${article.slug}`}
                        className="inline-block rounded-lg bg-bosporus-light px-3 py-2 text-sm font-semibold text-bosporus hover:underline"
                      >
                        {article.h1}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
