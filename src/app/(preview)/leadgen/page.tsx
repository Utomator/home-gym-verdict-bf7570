import { LeadgenHomeTemplate } from '@/components/templates/LeadgenHomeTemplate'
import { ServiceAreaTemplate } from '@/components/templates/ServiceAreaTemplate'

/**
 * DB-FREE LEADGEN PREVIEW — a realistic local lead-gen site
 * ("Lone Star Plumbing", an Austin plumber) rendered with hardcoded sample
 * content. No database, no CMS, no env. Renders under the (preview) root layout
 * so it can be screenshotted with zero infrastructure.
 *
 * It shows BOTH halves of the leadgen archetype on one scrollable page:
 *   1) a sample SERVICE-AREA page — "Emergency Plumbing in Austin"
 *   2) the leadgen HOME — hero + services/areas grid + contact + lead form + FAQ
 *
 * A sample BRAND THEME is applied at the preview scope via the token vars, so
 * the whole funnel recolours from one place. The lead form's submit action is
 * inert here (no DB) but the form + WhatsApp CTA render fully.
 */

const BRAND = 'Lone Star Plumbing'
const WHATSAPP = '+1 (555) 014-9920'
const PHONE = '+1 (555) 014-9920'
const EMAIL = 'hello@lonestarplumbing.example'
const LOCATION = 'Austin, TX'
const MAP_SRC = 'https://www.google.com/maps?q=Austin%20TX&output=embed'

const HIGHLIGHTS = [
  {
    icon: 'Clock' as const,
    title: 'Same-day service',
    description: 'Call before noon and a licensed plumber is at your Austin door the same afternoon.',
  },
  {
    icon: 'BadgeCheck' as const,
    title: 'Upfront flat pricing',
    description: 'You approve the price before we start. The number we quote is the number you pay.',
  },
  {
    icon: 'ShieldCheck' as const,
    title: 'Licensed & insured',
    description: 'Every technician is Texas-licensed and fully insured, so your home is protected.',
  },
  {
    icon: 'PhoneCall' as const,
    title: '24/7 emergency line',
    description: 'Burst pipe at 2am? A real plumber answers our Austin emergency line, day or night.',
  },
  {
    icon: 'Wrench' as const,
    title: 'Repairs & remodels',
    description: 'From a leaky trap to a full re-pipe or bathroom remodel — one local team for all of it.',
  },
  {
    icon: 'Sparkles' as const,
    title: 'We leave it spotless',
    description: 'Drop cloths down, boots off, mess gone. You would never know we were there.',
  },
]

const FAQ = [
  {
    question: 'How fast can you reach me in Austin?',
    answer:
      'For standard repairs booked before noon we aim for same-day service with a 90-minute arrival window across the Austin metro. Emergencies are prioritised 24/7.',
  },
  {
    question: 'Do you charge a call-out fee?',
    answer:
      'No call-out fee on weekday appointments. After-hours and weekend emergency visits carry a flat dispatch fee, which we tell you before we head out.',
  },
  {
    question: 'Will I know the price before you start?',
    answer:
      'Always. We diagnose the issue, give you a flat all-in price, and only begin once you approve it. No hourly surprises.',
  },
  {
    question: 'Are you licensed and insured?',
    answer:
      'Yes — every plumber on our team is Texas-licensed and we carry full liability insurance. Happy to share our licence numbers on request.',
  },
]

const FOOTER = {
  description:
    'Licensed, insured, on-time plumbing for Austin homes. Same-day repairs and full remodels.',
  columns: [
    {
      title: 'Services',
      links: [
        { label: 'Emergency repairs', href: '#contact' },
        { label: 'Water heaters', href: '#contact' },
        { label: 'Drain cleaning', href: '#contact' },
      ],
    },
    {
      title: 'Areas',
      links: [
        { label: 'Austin', href: '#areas' },
        { label: 'Round Rock', href: '#areas' },
        { label: 'Cedar Park', href: '#areas' },
      ],
    },
    {
      title: 'Follow',
      links: [
        { label: 'Instagram', href: '#' },
        { label: 'Facebook', href: '#' },
      ],
    },
  ],
  legalLinks: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
  ],
}

export default function LeadgenPreviewPage() {
  return (
    <>
      <style>{`
        .preview-root {
          max-width: none;
          margin: 0;
          padding: 0;
          font-family: var(--font-sans);
          line-height: 1.5;
          color: var(--foreground);
          background: var(--background);
        }
        .preview-root a { text-decoration: none; }
        .preview-theme {
          --background: #ffffff;
          --foreground: #0f172a;

          --card: #ffffff;
          --card-foreground: #0f172a;

          --muted: #f1f5f9;
          --muted-foreground: #51607a;

          --accent: #eff6ff;
          --accent-foreground: #16335c;

          /* ONE brand accent — a trustworthy services blue. */
          --primary: #2563eb;
          --primary-foreground: #ffffff;

          --secondary: #eef2f8;
          --secondary-foreground: #1e293b;

          --border: #e2e8f0;
          --input: #e2e8f0;
          --ring: #2563eb;

          --radius: 0.75rem;

          --shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
          --shadow-md: 0 6px 18px -4px rgb(15 23 42 / 0.10);
          --shadow-lg: 0 18px 40px -12px rgb(15 23 42 / 0.16);

          /* Lead-block token aliases (LeadForm/ContactBlock family). */
          --color-surface: #ffffff;
          --color-surface-2: #f1f5f9;
          --color-fg: #0f172a;
          --color-fg-muted: #51607a;
          --color-border: #e2e8f0;
          --color-brand: #2563eb;
          --color-brand-fg: #ffffff;
          --color-brand-hover: #1d4ed8;
          --color-danger: #dc2626;
          --color-success: #16a34a;
          --radius-md: 0.5rem;
          --radius-lg: 0.75rem;
          --radius-pill: 9999px;

          --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
          --font-display: var(--font-space-grotesk), var(--font-inter), ui-sans-serif, sans-serif;
          font-family: var(--font-sans);
        }
        .preview-divider {
          margin: 0;
          border: 0;
          border-top: 2px dashed var(--border);
        }
        .preview-label {
          background: var(--muted);
          color: var(--muted-foreground);
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 24px;
        }
      `}</style>

      <div className="preview-theme">
        {/* ── 1) Sample SERVICE-AREA page ────────────────────────────────── */}
        <p className="preview-label">Sample service-area page · /emergency-plumbing/austin</p>
        <ServiceAreaTemplate
          brandName={BRAND}
          service="Emergency Plumbing"
          city="Austin"
          eyebrow="Licensed · Insured · Same-day service"
          intro="Burst pipe, no hot water, or a blocked drain in Austin? Our licensed plumbers show up on time, quote up front, and clean up after. Most emergency calls handled same day."
          ctaLabel="Get a free quote"
          highlights={{
            heading: 'Emergency plumbing done right in Austin',
            description:
              'No surprise charges, no mess left behind, and no waiting around all day for a technician who never shows.',
            items: HIGHLIGHTS,
          }}
          contact={{
            phone: PHONE,
            whatsapp: WHATSAPP,
            whatsappText: 'Hi Lone Star Plumbing, I need emergency plumbing in Austin…',
            email: EMAIL,
            address: LOCATION,
            mapEmbedSrc: MAP_SRC,
          }}
          leadForm={{ footnote: `Call ${PHONE} · ${EMAIL} · ${LOCATION}` }}
          faq={FAQ}
          footer={FOOTER}
        />

        <hr className="preview-divider" />

        {/* ── 2) Leadgen HOME ────────────────────────────────────────────── */}
        <p className="preview-label">Leadgen home · /</p>
        <LeadgenHomeTemplate
          brandName={BRAND}
          hero={{
            eyebrow: 'Austin · Licensed · Insured',
            title: (
              <>
                Fast, fair-priced plumbing for <span className="text-primary">Austin homes</span>
              </>
            ),
            lede: 'Emergency repairs, water heaters, drains and full remodels — one licensed local team, upfront pricing, and same-day service across the Austin metro.',
            footnote: '4.9/5 from 1,200+ Austin neighbours · No call-out fee on weekdays',
          }}
          ctaLabel="Get a free quote"
          highlights={{
            heading: 'Plumbing done right the first time',
            description:
              'No surprise charges, no mess left behind, and no waiting around all day for a technician who never shows.',
            items: HIGHLIGHTS,
          }}
          areas={{
            description: 'Pick your service and city to see details and request a quote.',
            items: [
              { service: 'Emergency Plumbing', city: 'Austin', href: '/emergency-plumbing/austin' },
              { service: 'Water Heater Repair', city: 'Austin', href: '/water-heater-repair/austin' },
              { service: 'Drain Cleaning', city: 'Austin', href: '/drain-cleaning/austin' },
              { service: 'Emergency Plumbing', city: 'Round Rock', href: '/emergency-plumbing/round-rock' },
              { service: 'Water Heater Repair', city: 'Cedar Park', href: '/water-heater-repair/cedar-park' },
              { service: 'Drain Cleaning', city: 'Pflugerville', href: '/drain-cleaning/pflugerville' },
            ],
          }}
          contact={{
            phone: PHONE,
            whatsapp: WHATSAPP,
            whatsappText: 'Hi Lone Star Plumbing, I would like a quote…',
            email: EMAIL,
            address: LOCATION,
            mapEmbedSrc: MAP_SRC,
          }}
          leadForm={{ footnote: `Call ${PHONE} · ${EMAIL} · ${LOCATION}` }}
          faq={FAQ}
          footer={FOOTER}
        />
      </div>
    </>
  )
}
