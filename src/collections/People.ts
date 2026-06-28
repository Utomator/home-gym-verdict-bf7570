import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publicReadOnlyPublished } from '@/lib/access'

export const People: CollectionConfig = {
  slug: 'people',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'updatedAt'] },
  access: {
    create: isAdminOrEditor,
    read: publicReadOnlyPublished,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: { drafts: true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'role', type: 'text' },
    { name: 'bio', type: 'richText' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: ['github', 'linkedin', 'twitter', 'mastodon', 'website'],
          required: true,
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    { name: 'expertise', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    {
      name: 'credentials',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
  ],
}
