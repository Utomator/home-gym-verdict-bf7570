import type { CollectionConfig } from 'payload'
import { env } from '@/lib/env'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: env().MEDIA_DIR,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 432, position: 'centre' },
      { name: 'feature', width: 1600, height: 900, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe the image for screen readers and search engines (what it shows, not just a label). Required so content images never ship with empty alt text.',
      },
    },
    { name: 'caption', type: 'text' },
  ],
}
