import type { CollectionConfig } from 'payload'
import { adminOrEditorReadOnly, denyAll } from '@/lib/access'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: { useAsTitle: 'email', defaultColumns: ['name', 'email', 'createdAt'] },
  access: {
    // Public form Server Action calls Payload Local API with overrideAccess: true
    create: () => true,
    read: adminOrEditorReadOnly,
    update: denyAll,
    delete: denyAll,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'company', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    { name: 'source', type: 'text', defaultValue: 'contact-form' },
    { name: 'userAgent', type: 'text' },
  ],
  timestamps: true,
}
