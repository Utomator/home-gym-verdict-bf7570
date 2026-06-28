import { type NextRequest, NextResponse } from 'next/server'

const LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/mcp/server-card.json>; rel="service-meta"; type="application/json"',
  '</llms.txt>; rel="describedby"; type="text/markdown"',
].join(', ')

const STATIC_CONTENT_PREFIXES = ['/blog']
const STATIC_CONTENT_PATHS = ['/', '/contact']

function isContentRoute(pathname: string): boolean {
  if (STATIC_CONTENT_PATHS.includes(pathname)) return true
  if (STATIC_CONTENT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true
  }
  // Pages catchall — single-segment lowercase slug. We can't query Payload
  // synchronously here; the /md/[slug] handler returns 404 if absent.
  if (/^\/[a-z0-9][a-z0-9-]*$/.test(pathname)) return true
  return false
}

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  const accept = req.headers.get('accept') ?? ''
  const wantsMarkdown = accept.includes('text/markdown')

  // Block direct access to /md tree without Accept: text/markdown
  if (pathname === '/md' || pathname.startsWith('/md/')) {
    if (!wantsMarkdown) return new NextResponse('Not Found', { status: 404 })
    return NextResponse.next()
  }

  // Rewrite content routes to their /md counterpart on Accept: text/markdown
  if (wantsMarkdown && isContentRoute(pathname)) {
    const target = pathname === '/' ? '/md' : `/md${pathname}`
    return NextResponse.rewrite(new URL(target, req.url))
  }

  // Pass-through with Link + Vary headers on every other response
  const res = NextResponse.next()
  res.headers.set('Link', LINK_HEADER)
  res.headers.set('Vary', 'Accept')
  return res
}

export const config = {
  matcher: ['/((?!api|_next|admin|\\.well-known|favicon|robots\\.txt|sitemap\\.xml).*)'],
}
