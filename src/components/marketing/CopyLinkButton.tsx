'use client'
import { useState } from 'react'

/**
 * CopyLinkButton — the only client island inside ShareButtons. Copies the
 * canonical post URL to the clipboard and flashes a confirmation. Falls back
 * silently (button still focusable, label unchanged) when the Clipboard API is
 * unavailable. Accessible: real <button> with an aria-label and an aria-live
 * status so the copy confirmation is announced.
 */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context / permissions) — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Link copied to clipboard' : 'Copy link to clipboard'}
      className={className}
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
      <span aria-live="polite" className="text-sm font-medium">
        {copied ? 'Copied' : 'Copy link'}
      </span>
    </button>
  )
}
