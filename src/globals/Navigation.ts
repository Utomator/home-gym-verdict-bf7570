import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '@/lib/access'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  access: { read: () => true, update: isAdminOrEditor },
  fields: [
    {
      name: 'header',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'footer',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
