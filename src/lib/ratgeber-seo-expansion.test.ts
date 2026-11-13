import { describe, expect, it } from "vitest";
import { ADDITIONAL_RATGEBER_ARTICLES } from "@/lib/ratgeber-seo-expansion";
import { RATGEBER_ARTICLES, getAllRatgeberSlugs, getRatgeberArticle } from "@/lib/ratgeber";
import { ratgeberArticleJsonLd, ratgeberMetadata } from "@/lib/seo";

describe("Search-intent SEO guide expansion", () => {
  it("contains six unique, substantive new guides", () => {
    expect(ADDITIONAL_RATGEBER_ARTICLES).toHaveLength(6);
    for (const article of ADDITIONAL_RATGEBER_ARTICLES) {
      expect(article.sections.length).toBeGreaterThanOrEqual(3);
      expect(article.faq.length).toBeGreaterThanOrEqual(3);
      expect(article.intro.length).toBeGreaterThan(170);
      expect(article.description.length).toBeLessThanOrEqual(160);
      expect(article.publishedOn).toBe("2026-11-13");
      for (const section of article.sections) {
        expect(section.paragraphs.length).toBeGreaterThanOrEqual(2);
      }
      expect(getRatgeberArticle(article.slug)).toEqual(article);
    }
  });

  it("has no duplicate guide slugs, headings or section ids", () => {
    expect(new Set(getAllRatgeberSlugs()).size).toBe(RATGEBER_ARTICLES.length);
    expect(new Set(RATGEBER_ARTICLES.map(a => a.h1)).size).toBe(RATGEBER_ARTICLES.length);
    for (const article of RATGEBER_ARTICLES) {
      expect(new Set(article.sections.map(s => s.id)).size).toBe(article.sections.length);
    }
  });

  it("renders indexable German canonicals and structured Article data", () => {
    for (const article of ADDITIONAL_RATGEBER_ARTICLES) {
      const meta = ratgeberMetadata(article.title, article.description, article.slug, "de");
      const trMeta = ratgeberMetadata(article.title, article.description, article.slug, "tr");
      const schema = ratgeberArticleJsonLd(article);
      expect(meta.alternates?.canonical).toBe("https://www.bosporus-gmbh.com/ratgeber/" + article.slug);
      expect(meta.robots).toMatchObject({ index: true, follow: true });
      expect(trMeta.robots).toMatchObject({ index: false, follow: true });
      expect(schema["@type"]).toBe("Article");
      expect(schema.inLanguage).toBe("de-DE");
      expect(schema.datePublished).toBe("2026-11-13");
      expect(schema.publisher["@id"]).toBe("https://www.bosporus-gmbh.com/#organization");
    }
  });

  it("links to categories and existing identified product SKU candidates", () => {
    const all = ADDITIONAL_RATGEBER_ARTICLES.flatMap(a => a.relatedCategorySlugs);
    expect(all).toContain("molkerei");
    expect(all).toContain("snacks-suesswaren");
    expect(all).toContain("verpackung-reinigungsmittel-hygiene");
    expect(
      ADDITIONAL_RATGEBER_ARTICLES.some(a =>
        a.relatedProductSkus.includes("milram-gouda-48-15kg")
      )
    ).toBe(true);
  });
});
