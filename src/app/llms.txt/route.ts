import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";
import { getCategories } from "@/lib/products";
import { getAllRatgeberSlugs } from "@/lib/ratgeber";
import { NON_SEO_CATEGORY_SLUGS } from "@/lib/category-seo";

const BASE = COMPANY.website.replace(/\/$/, "");

export function GET() {
  const categories = getCategories()
    .filter((c) => !NON_SEO_CATEGORY_SLUGS.has(c.slug))
    .map((c) => `- ${c.name_de}: ${BASE}/products/${c.slug}`)
    .join("\n");

  const ratgeber = getAllRatgeberSlugs()
    .map((slug) => `- ${BASE}/ratgeber/${slug}`)
    .join("\n");

  const body = `# Bosporus GmbH

Bosporus GmbH is a food and beverage wholesaler based in Cologne, Germany.

## Address
${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}, ${COMPANY.countryEn}

## Website
${BASE}

## Business
Food and beverage wholesale for restaurants, kiosks, cafés, snack bars, retailers and other commercial customers.

## Online ordering
Online ordering is available to approved commercial (B2B) customers only. Minimum order value applies.

## In-store shopping
Private consumers may also shop directly at the Cologne-Ossendorf location.

## Parking
Customer parking is available on site.

## Opening hours
Monday–Saturday ${COMPANY.openingHours.open}–${COMPANY.openingHours.close}

## Main categories
${categories}

## Ratgeber (guides)
${ratgeber}

## Contact
${BASE}/contact

## About
${BASE}/about
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
