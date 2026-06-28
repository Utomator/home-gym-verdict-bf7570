import { Container } from '@/components/marketing/Container'
import { PageHeader } from '@/components/marketing/PageHeader'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import { ogImages, seoMeta } from '@p51/engine'
import { ContactForm } from './_components/ContactForm'

// This page's generateMetadata reads the `site-settings` global (a DB query), so it
// must render dynamically rather than at build-time prerender — consistent with the
// other marketing pages (home/blog/authors/search). Without this, `next build`
// fails to prerender /contact whenever the database is unreachable (CI smoke builds,
// or before migrations run).
export const dynamic = 'force-dynamic'

type MediaLike = { url?: string | null }
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined

export async function generateMetadata() {
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  return seoMeta({
    canonical: '/contact',
    title: 'Start a project',
    description:
      'Tell us about the AI system you want to build. We typically respond within one business day.',
    siteName,
    images: ogImages(base, undefined, asMedia(settings.defaultMeta?.image)?.url, siteName),
  })
}

export default function Contact() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Start a project"
        lede="Tell us about the AI system you want to build. We typically respond within one business day."
      />
      <section>
        <Container size="wide">
          <div>
            <div>
              <ContactForm />
            </div>
            <aside>
              <div>
                <h2>
                  What to expect
                </h2>
                <ol>
                  <li>
                    <span>1. Reply within 24h.</span> A
                    short note with next steps.
                  </li>
                  <li>
                    <span>2. 30-min discovery call.</span>{' '}
                    Scope the problem, the constraints, and the unknowns.
                  </li>
                  <li>
                    <span>3. Proposal.</span> Outcome,
                    timeline, deliverables.
                  </li>
                </ol>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  )
}
