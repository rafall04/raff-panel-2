/**
 * Site registry for multi-tenant operation.
 *
 * This single panel (client.rafnet.my.id) serves several raf-bot-v2 backends,
 * one per physical site. Every request is pinned to exactly one site: the choice
 * is made at login, sealed into the NextAuth JWT as a `site` claim, and every
 * backend call resolves its base URL from that claim. A customer therefore can
 * never reach another site's backend within a session — the process may know
 * about all sites, but a given authenticated request only ever talks to one.
 *
 * Adding a site = add an entry to SITE_META and set its `API_URL_<ID>` env var.
 */

export const SITE_IDS = ["DANDER", "TANJUNGHARJO"] as const;

export type SiteId = (typeof SITE_IDS)[number];

export interface SiteMeta {
  id: SiteId;
  /** Shown to customers on the login location picker. */
  label: string;
}

export const SITE_META: Record<SiteId, SiteMeta> = {
  DANDER: { id: "DANDER", label: "RAF-DANDER" },
  TANJUNGHARJO: { id: "TANJUNGHARJO", label: "RAF-TANJUNGHARJO" },
};

/** Ordered list for rendering the picker. */
export const SITE_LIST: SiteMeta[] = SITE_IDS.map((id) => SITE_META[id]);

export function isSiteId(value: unknown): value is SiteId {
  return (
    typeof value === "string" && (SITE_IDS as readonly string[]).includes(value)
  );
}

/**
 * Site used for unauthenticated, pre-login content (company name / branding)
 * when the visitor has not picked a location yet. Overridable via DEFAULT_SITE.
 */
export const DEFAULT_SITE: SiteId = isSiteId(process.env.DEFAULT_SITE)
  ? process.env.DEFAULT_SITE
  : SITE_IDS[0];

/**
 * Resolve a site's backend base URL from its env var.
 *
 * Throws rather than falling back to another site: a misconfigured site must
 * fail loudly, never silently route a customer to the wrong tenant. The env is
 * read at call time (not module load) so this stays safe to import from the
 * Edge runtime without pinning values at build.
 */
export function getSiteApiUrl(site: SiteId): string {
  const urls: Record<SiteId, string | undefined> = {
    DANDER: process.env.API_URL_DANDER,
    TANJUNGHARJO: process.env.API_URL_TANJUNGHARJO,
  };
  const url = urls[site];
  if (!url) {
    throw new Error(
      `Backend URL for site "${site}" is not configured (set API_URL_${site}).`,
    );
  }
  // Trailing slash would double up against endpoints that start with "/".
  return url.replace(/\/+$/, "");
}
