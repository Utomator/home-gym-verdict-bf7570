import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * /.well-known/llms.txt — the .well-known mirror of /llms.txt (action item 15).
 *
 * The llms.txt convention is still settling on a location: the original spec
 * puts the file at the site ROOT (/llms.txt, which this app already serves with
 * the full content index), while the emerging /.well-known/ convention expects
 * discovery files under that directory. We serve BOTH so an agent that probes
 * either path resolves the index. Rather than duplicate the (DB-driven) builder,
 * this route 308-redirects to the canonical /llms.txt so there is a single
 * source of truth and the index never drifts between the two URLs.
 *
 * 308 (permanent) preserves the method and signals the canonical location to
 * crawlers. No DB access here, so it is build-safe with no live database.
 */
export function GET(): Response {
  const base = env().NEXT_PUBLIC_SERVER_URL
  return Response.redirect(`${base}/llms.txt`, 308)
}
