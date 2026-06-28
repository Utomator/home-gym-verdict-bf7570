import { LandingTemplate } from '@/components/templates/LandingTemplate'

/**
 * DB-FREE LANDING PREVIEW — a realistic local-services lead funnel
 * ("Northside Plumbing Co.") assembled from LandingTemplate with hardcoded
 * sample content. No database, no CMS, no env. Renders under the (preview)
 * root layout so it can be screenshotted with zero infrastructure.
 *
 * A sample BRAND THEME is applied at the preview scope via the token vars (one
 * blue accent + the Space Grotesk / Inter pairing wired in the preview layout),
 * proving the whole funnel recolours from a single token layer. The lead form's
 * submit action is inert here (no DB) but the form + WhatsApp CTA render fully.
 */

const BRAND = 'Northside Plumbing Co.'
const WHATSAPP = '+1 (555) 018-7720'

export default function LandingPreviewPage() {
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

          /* Lead-block token aliases (LeadForm/LeadButton family). */
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
      `}</style>

      <div className="preview-theme">
        <LandingTemplate
          brandName={BRAND}
          hero={{
            variant: 'centered',
            eyebrow: 'Licensed · Insured · Same-day service',
            title: (
              <>
                Fast, fair-priced plumbing for <span className="text-primary">Northside homes</span>
              </>
            ),
            lede: 'Burst pipe, dripping faucet, or a full bathroom remodel — our licensed plumbers show up on time, quote up front, and clean up after. Most jobs done same day.',
            footnote: '4.9/5 from 1,200+ neighbours · No call-out fee on weekdays',
          }}
          ctaLabel="Get a free quote"
          features={{
            eyebrow: 'Why Northside',
            heading: 'Plumbing done right the first time',
            description:
              'No surprise charges, no mess left behind, and no waiting around all day for a technician who never shows.',
            columns: 3,
            items: [
              {
                icon: 'Clock',
                title: 'Same-day service',
                description:
                  'Call before noon and we will be at your door the same afternoon for most repairs.',
              },
              {
                icon: 'BadgeCheck',
                title: 'Upfront flat pricing',
                description:
                  'You approve the price before we start. The number we quote is the number you pay.',
              },
              {
                icon: 'ShieldCheck',
                title: 'Licensed & insured',
                description:
                  'Every technician is state-licensed and fully insured, so your home is protected.',
              },
              {
                icon: 'Wrench',
                title: 'Repairs & remodels',
                description:
                  'From a leaky trap to a full re-pipe or bathroom remodel — one team for all of it.',
              },
              {
                icon: 'Sparkles',
                title: 'We leave it spotless',
                description:
                  'Drop cloths down, boots off, mess gone. You would never know we were there.',
              },
              {
                icon: 'PhoneCall',
                title: '24/7 emergency line',
                description:
                  'Water everywhere at 2am? A real plumber answers our emergency line, day or night.',
              },
            ],
          }}
          stats={{
            items: [
              { value: '12k+', label: 'Jobs completed' },
              { value: '4.9/5', label: 'Average rating' },
              { value: '90 min', label: 'Avg. arrival window' },
              { value: '18 yrs', label: 'Serving Northside' },
            ],
          }}
          testimonial={{
            quote:
              'Called them when our water heater died on a Sunday. A real person picked up, a plumber was here in an hour, and the price was exactly what they quoted on the phone. I have already recommended them to three neighbours.',
            authorName: 'Marcus Reilly',
            authorRole: 'Homeowner · Northside',
            rating: 5,
          }}
          faq={{
            eyebrow: 'Good to know',
            heading: 'Common questions',
            items: [
              {
                question: 'Do you charge a call-out fee?',
                answer:
                  'No call-out fee on weekday appointments. For after-hours and weekend emergency visits a flat dispatch fee applies, which we tell you before we head out.',
              },
              {
                question: 'How fast can you get here?',
                answer:
                  'For standard repairs booked before noon, we aim for same-day service with a 90-minute arrival window. Emergencies are prioritised 24/7.',
              },
              {
                question: 'Will I know the price before you start?',
                answer:
                  'Always. We diagnose the issue, give you a flat, all-in price, and only begin once you approve it. No hourly surprises.',
              },
              {
                question: 'Are you licensed and insured?',
                answer:
                  'Yes — every plumber on our team is state-licensed and we carry full liability insurance. We are happy to share our licence numbers on request.',
              },
            ],
          }}
          closingCta={{
            eyebrow: 'Ready when you are',
            heading: 'Get your free, no-obligation quote',
            body: 'Tell us what is going on and we will text you back a flat price — usually within the hour during business hours.',
          }}
          contact={{
            heading: 'Request a free quote',
            description:
              'Share a few details about the job and the best number to reach you. We will reply within one business day — or right away on WhatsApp.',
            submitLabel: 'Get a free quote',
            whatsapp: WHATSAPP,
            whatsappText: 'Hi Northside Plumbing, I would like a quote for…',
            footnote: 'Call (555) 018-7720 · hello@northsideplumbing.example · Northside',
          }}
          footer={{
            description:
              'Licensed, insured, on-time plumbing for Northside homes. Same-day repairs and full remodels.',
            columns: [
              {
                title: 'Services',
                links: [
                  { label: 'Emergency repairs', href: '#contact' },
                  { label: 'Water heaters', href: '#contact' },
                  { label: 'Remodels', href: '#contact' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '#' },
                  { label: 'Reviews', href: '#' },
                  { label: 'Contact', href: '#contact' },
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
          }}
        />
      </div>
    </>
  )
}
