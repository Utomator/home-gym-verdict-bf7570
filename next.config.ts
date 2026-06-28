import path from 'node:path'
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

/**
 * When media is served from the Cloudflare R2 CDN domain (R2_PUBLIC_URL), the
 * Next <Image> optimizer needs that host allow-listed as a remote pattern.
 * Derived from env so it's empty in local-disk mode (same-origin) and populated
 * on Vercel/R2. Falls back to no remote patterns when R2_PUBLIC_URL is unset.
 */
function r2RemotePatterns(): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!publicUrl) return []
  try {
    const u = new URL(publicUrl)
    return [{ protocol: u.protocol.replace(':', '') as 'http' | 'https', hostname: u.hostname }]
  } catch {
    return []
  }
}

const config: NextConfig = {
  reactCompiler: false,
  // The SEO engine is a workspace package shipped as TS source; Next must transpile it.
  transpilePackages: ['@p51/engine'],
  serverExternalPackages: ['pino', 'pino-pretty'],
  images: {
    // Prefer AVIF (15-30% smaller than WebP) for the LCP/byte-weight win;
    // Next falls back to WebP, then the original format, per browser support.
    formats: ['image/avif', 'image/webp'],
    // Local-disk mode: media is same-origin via Payload's upload route.
    // R2 mode: allow the CDN host so next/image can optimize R2-served media.
    remotePatterns: r2RemotePatterns(),
  },
  sassOptions: {
    includePaths: [path.resolve('node_modules')],
  },
}

export default withPayload(config)
