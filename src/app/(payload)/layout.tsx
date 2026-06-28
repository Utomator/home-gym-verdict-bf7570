/* THIS FILE WAS ADAPTED FROM PAYLOAD'S OFFICIAL LAYOUT TEMPLATE.
 * IT IS RECOMMENDED THAT YOU DO NOT MODIFY THIS FILE.
 */

import { handleServerFunctions, RootLayout as PayloadRootLayout } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import config from '@/payload.config'
import { importMap } from './admin/importMap'
// Component styles + design tokens for the embedded admin. Imported via
// relative paths through the symlinked node_modules because Turbopack +
// pnpm doesn't honour the @payloadcms/ui exports map for plain CSS imports.
import '../../../node_modules/@payloadcms/ui/dist/styles.css'
import './custom.scss'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <PayloadRootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </PayloadRootLayout>
)

export default Layout
