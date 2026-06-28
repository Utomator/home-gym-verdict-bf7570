/**
 * Pure share-target builder for ShareButtons.
 *
 * Returns the social share intents for a given canonical URL + title. Network
 * targets are plain `href` links (no tracking script, no SDK) that open the
 * platform's own share dialog; `copy` is an action target (no href) handled by
 * a tiny client button. Kept framework-free so it is unit-testable in isolation.
 */

export type ShareTargetId = 'x' | 'linkedin' | 'facebook' | 'copy'

export type ShareTarget = {
  id: ShareTargetId
  /** Accessible label, e.g. "Share on X". */
  label: string
  /** Present for link targets; absent for the copy action. */
  href?: string
}

export function shareTargets(url: string, title: string): ShareTarget[] {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  return [
    {
      id: 'x',
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    },
    {
      id: 'linkedin',
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
    {
      id: 'facebook',
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    {
      id: 'copy',
      label: 'Copy link',
    },
  ]
}
