import { unstable_cache } from 'next/cache'

/**
 * ON-DEMAND ISR DATA CACHE (action item 6)
 * ----------------------------------------
 * The public marketing pages + the sitemap/feed routes each read from Payload on
 * every request. With `force-dynamic` that read hit the database every single
 * time (the audit's Core-Web-Vitals / TTFB-at-scale finding). This helper wraps
 * those reads in `unstable_cache` so the *data layer* is cached and served from
 * the Next data cache, tagged so the EXISTING publish hook invalidates it.
 *
 * WHY NOT remove `force-dynamic` and prerender? The template must `next build`
 * with NO live DB (provisioning copies + builds it before any database exists).
 * Removing `force-dynamic` from a STATIC route (`/`, `/blog`, `/contact`, …)
 * makes Next attempt a build-time prerender, which runs these Payload reads and
 * breaks the no-DB build — that is exactly why commit b950734 ADDED
 * `force-dynamic` to /contact. So static routes stay on-demand (render per
 * request) but now pull their Payload data from this cache instead of the DB;
 * dynamic `[slug]` routes (no generateStaticParams) are on-demand-then-cached
 * ISR for free. Either way, publishing invalidates instantly via the tags below,
 * which mirror src/hooks/revalidate-after-change.ts (`${collection}:${slug}` and
 * `sitemap`).
 *
 * Tag contract (kept in lockstep with revalidate-after-change.ts):
 *   - docTag(collection, slug)  → `${collection}:${slug}`  (per-document reads)
 *   - 'sitemap'                  → every publish revalidates it, so list/index
 *                                  reads tag with it to refresh on any change.
 *   - collectionListTag(c)      → `${collection}:list`, an extra precise handle
 *                                  for a collection's list reads. The publish
 *                                  hook does not emit it today; 'sitemap' already
 *                                  covers list freshness. It exists so a future
 *                                  hook can target list invalidation without a
 *                                  full-site sweep.
 *
 * Default revalidate window is short (a safety net if a tag is ever missed); the
 * tags do the real, instant invalidation on publish.
 */

/** Per-document cache tag, identical to the publish hook's `${collection}:${slug}`. */
export const docTag = (collection: string, slug: string): string => `${collection}:${slug}`

/**
 * Per-collection list cache tag. Uses a `:list:` sentinel segment that can never
 * be produced by `docTag` (whose form is `${collection}:${slug}`, and slugs are
 * single URL-safe segments with no `:`), so a list tag never collides with any
 * document's tag.
 */
export const collectionListTag = (collection: string): string => `${collection}:list:`

/** Background revalidation window (seconds) used as a backstop behind the tags. */
const DEFAULT_REVALIDATE_SECONDS = 300

/**
 * Wrap an async Payload read in the Next data cache.
 *
 * @param fn       the read to memoize (must close over its own args — pass a
 *                 zero-arg thunk so the cache key stays stable per `keyParts`).
 * @param keyParts stable, serializable parts that uniquely identify this read.
 * @param tags     cache tags; combine `docTag` / `collectionListTag` / 'sitemap'
 *                 so the existing `revalidateTag` calls invalidate this entry.
 */
export function cachedRead<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  tags: string[],
  revalidateSeconds: number = DEFAULT_REVALIDATE_SECONDS,
): Promise<T> {
  return unstable_cache(fn, keyParts, { tags, revalidate: revalidateSeconds })()
}
