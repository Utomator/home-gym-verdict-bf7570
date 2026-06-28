import type { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'

export const isAdminOrEditor: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor'

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}

export const publicReadOnlyPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

// Submissions / WebhookEvents: public must not read; only admin/editor read; only server creates.
export const adminOrEditorReadOnly: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor'

export const denyAll: Access = () => false
