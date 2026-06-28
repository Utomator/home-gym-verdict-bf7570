import { CopyLinkButton } from './CopyLinkButton'
import { type ShareTargetId, shareTargets } from './share-urls'

/**
 * ShareButtons — X / LinkedIn / Facebook share links + a copy-link button for a
 * blog post. SERVER COMPONENT: the share intents are plain anchor links built
 * from the canonical URL (no tracking script, no SDK, no client JS) and open in
 * a new tab. Only the copy-link action is a tiny client island (CopyLinkButton).
 *
 * Accessibility: each link/button carries an explicit accessible name
 * ("Share on X", etc.); icons are aria-hidden. Token-driven so it follows the
 * brand.
 */

const itemClass =
  'inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const targets = shareTargets(url, title)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-foreground">Share</span>
      {targets.map((t) =>
        t.id === 'copy' ? (
          <CopyLinkButton key={t.id} url={url} className={itemClass} />
        ) : (
          <a
            key={t.id}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.label}
            className={itemClass}
          >
            <ShareIcon id={t.id} />
            <span className="hidden sm:inline">{networkName(t.id)}</span>
          </a>
        ),
      )}
    </div>
  )
}

function networkName(id: ShareTargetId): string {
  if (id === 'x') return 'X'
  if (id === 'linkedin') return 'LinkedIn'
  if (id === 'facebook') return 'Facebook'
  return ''
}

const ICON_PATHS: Record<Exclude<ShareTargetId, 'copy'>, string> = {
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
}

function ShareIcon({ id }: { id: Exclude<ShareTargetId, 'copy'> }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-4"
    >
      <path d={ICON_PATHS[id]} />
    </svg>
  )
}
