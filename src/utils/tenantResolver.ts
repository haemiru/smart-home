/**
 * Tenant resolution from hostname.
 *
 * Parses window.location.hostname to determine which tenant (agent) the
 * current request belongs to.
 */

export type TenantSource =
  | { source: 'slug'; identifier: string }
  | { source: 'custom_domain'; identifier: string }
  | { source: 'none' }        // platform root (landing page)
  | { source: 'dev_default' } // localhost without subdomain

/** Domains that belong to the platform itself (not a tenant). */
const PLATFORM_DOMAINS = ['jungaepro.com', 'smarthome.co.kr', 'localhost']

/** Vercel preview/production domains — treat as dev_default (mock tenant). */
const VERCEL_DOMAIN_SUFFIXES = ['.vercel.app']

/**
 * Extract tenant info from the current hostname.
 *
 * | Hostname                        | Result                                       |
 * |---------------------------------|----------------------------------------------|
 * | gangnam.jungaepro.com           | { source: 'slug', identifier: 'gangnam' }    |
 * | www.custom.com                  | { source: 'custom_domain', identifier: ... }  |
 * | jungaepro.com / www.jungaepro   | { source: 'none' } → landing page            |
 * | demo.localhost:5173             | { source: 'slug', identifier: 'demo' }        |
 * | localhost:5173                  | { source: 'dev_default' }                     |
 */
export function resolveTenantFromHostname(): TenantSource {
  const hostname = window.location.hostname // no port

  // Check each platform domain
  for (const domain of PLATFORM_DOMAINS) {
    if (hostname === domain || hostname === `www.${domain}`) {
      // Bare platform domain → landing page (or dev default for localhost)
      return domain === 'localhost' ? { source: 'dev_default' } : { source: 'none' }
    }

    // Check if hostname is a subdomain of a platform domain
    // e.g. "gangnam.smarthome.co.kr" ends with ".smarthome.co.kr"
    // e.g. "demo.localhost" ends with ".localhost"
    const suffix = `.${domain}`
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length)
      // Skip "www" — treat as bare domain
      if (sub === 'www') {
        return domain === 'localhost' ? { source: 'dev_default' } : { source: 'none' }
      }
      // Valid subdomain slug
      if (sub && !sub.includes('.')) {
        return { source: 'slug', identifier: sub }
      }
    }
  }

  // Check Vercel deployment domains → treat as dev_default (use mock tenant)
  for (const suffix of VERCEL_DOMAIN_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { source: 'dev_default' }
    }
  }

  // Not a platform domain → treat as custom domain
  return { source: 'custom_domain', identifier: hostname }
}
