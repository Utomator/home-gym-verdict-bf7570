import type { CollectionConfig } from 'payload'
import { adminOrEditorReadOnly, denyAll } from '@/lib/access'

export const WebhookEvents: CollectionConfig = {
  slug: 'webhook-events',
  admin: {
    useAsTitle: 'eventType',
    defaultColumns: ['source', 'eventType', 'processedAt', 'error'],
  },
  access: {
    create: () => true,
    read: adminOrEditorReadOnly,
    update: denyAll,
    delete: denyAll,
  },
  fields: [
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Calendly', value: 'calendly' },
        { label: 'Slack', value: 'slack' },
      ],
    },
    { name: 'eventType', type: 'text', required: true },
    { name: 'payload', type: 'json' },
    { name: 'processedAt', type: 'date' },
    { name: 'error', type: 'text' },
  ],
  timestamps: true,
}
