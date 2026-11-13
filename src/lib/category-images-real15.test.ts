import { describe, expect, it } from 'vitest';
import { CATEGORY_TILE_IMAGES, getCategoryImageUrl, getProductImageUrl, getCategoryBannerUrl } from './category-images';

const slugs = [
  'verpackung-reinigungsmittel-hygiene',
  'lebensmittel',
  'getraenke',
  'snacks-suesswaren',
  'tk-tiefkuehl',
  'konserven',
  'gewuerze',
  'saucen',
];

describe('actual product collages for category cards', () => {
  it('maps exactly eight tile categories to uniquely versioned assets', () => {
    expect(Object.keys(CATEGORY_TILE_IMAGES)).toEqual(slugs);
    expect(new Set(Object.values(CATEGORY_TILE_IMAGES)).size).toBe(8);
    for (const slug of slugs) {
      expect(getCategoryImageUrl(slug)).toBe(`/categories/${slug}-navy15-20261113.jpg`);
    }
  });

  it('does not misrepresent single products or category banners with multi-product collages', () => {
    expect(getProductImageUrl({image_url: null, image_urls: [], category_slug:'getraenke'}))
      .toBe('/categories/getraenke.jpg');
    expect(getCategoryBannerUrl('getraenke')).toBe('/banners/banner-getraenke.jpg');
  });

  it('keeps category fallback for all other categories', () => {
    expect(getCategoryImageUrl('molkerei')).toBe('/categories/molkerei.jpg');
  });
});
