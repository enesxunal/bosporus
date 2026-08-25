/**
 * Verified-bot / known-crawler detection for analytics exclusion only.
 * Never used to block page access or SEO crawling — only to skip funnel writes.
 * No fingerprinting: User-Agent header only, not persisted.
 */

const VERIFIED_BOT_PATTERNS: readonly RegExp[] = [
  /googlebot/i,
  /google-inspectiontool/i,
  /adsbot-google/i,
  /mediapartners-google/i,
  /bingbot/i,
  /bingpreview/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandex(bot|images)/i,
  /facebookexternalhit/i,
  /facebot/i,
  /meta-externalagent/i,
  /meta-externalfetcher/i,
  /twitterbot/i,
  /linkedinbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /claudebot/i,
  /anthropic-ai/i,
  /ccbot/i,
  /amazonbot/i,
  /ia_archiver/i,
  /screaming frog/i,
  /seznambot/i,
  /qwantify/i,
  /discordbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /preview\.page\.facebook/i,
];

/** Broad but still crawler-oriented tokens; applied after specific patterns. */
const GENERIC_CRAWLER_PATTERN =
  /(?:^|[^a-z])(?:bot|crawler|spider|slurp)(?:[^a-z]|$)/i;

/**
 * Returns true when the User-Agent looks like a known/verified crawler.
 * Empty or missing UA is treated as non-bot (avoid blocking privacy browsers).
 */
export function isVerifiedBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.trim();
  if (!ua) return false;
  if (VERIFIED_BOT_PATTERNS.some((pattern) => pattern.test(ua))) return true;
  // Avoid matching human browsers that mention "robot" in unrelated ways.
  if (/HeadlessChrome|PhantomJS|Puppeteer|Playwright/i.test(ua)) return true;
  return GENERIC_CRAWLER_PATTERN.test(ua);
}

export function userAgentFromRequest(request: Request): string | null {
  return request.headers.get("user-agent");
}
