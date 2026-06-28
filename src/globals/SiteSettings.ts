import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '@/lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true, // public read so middleware/route handlers can pull at request time
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: 'organization',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true, defaultValue: 'Home Gym Verdict' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'tagline', type: 'text' },
        { name: 'foundingDate', type: 'date' },
        {
          name: 'sameAs',
          type: 'array',
          label: 'Social profile URLs (Organization.sameAs)',
          fields: [{ name: 'url', type: 'text', required: true }],
        },
        {
          name: 'contactPoints',
          type: 'array',
          fields: [
            { name: 'contactType', type: 'text', required: true },
            { name: 'email', type: 'email' },
            { name: 'telephone', type: 'text' },
          ],
        },
        {
          name: 'founders',
          type: 'relationship',
          relationTo: 'people',
          hasMany: true,
        },
      ],
    },
    {
      name: 'contentSignals',
      type: 'group',
      label: 'AI Content-Signal policy (RFC draft-romm-aipref-contentsignals)',
      fields: [
        {
          name: 'aiTrain',
          type: 'select',
          required: true,
          defaultValue: 'no',
          options: ['yes', 'no'],
        },
        {
          name: 'search',
          type: 'select',
          required: true,
          defaultValue: 'yes',
          options: ['yes', 'no'],
        },
        {
          name: 'aiInput',
          type: 'select',
          required: true,
          defaultValue: 'yes',
          options: ['yes', 'no'],
        },
      ],
    },
    {
      name: 'defaultMeta',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
