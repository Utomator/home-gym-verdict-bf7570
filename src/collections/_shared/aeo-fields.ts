import type { Field } from 'payload'

export const aeoFields: Field = {
  name: 'aeo',
  type: 'group',
  label: 'AEO / Answer Engine',
  fields: [
    {
      name: 'answerSummary',
      type: 'textarea',
      maxLength: 600,
      admin: {
        description:
          'The 40–80 word direct answer that engines extract. Rendered at the top of the page and used for og:description.',
      },
    },
    {
      name: 'keyTakeaways',
      type: 'array',
      fields: [{ name: 'point', type: 'text', required: true }],
    },
    {
      name: 'faq',
      type: 'array',
      label: 'FAQs (rendered as visible Q&A and as FAQPage JSON-LD)',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        description:
          'Bumped when content is reviewed for accuracy. Drives `dateModified` in Article JSON-LD.',
      },
    },
  ],
}
