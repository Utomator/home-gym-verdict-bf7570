import { expect, test } from '@playwright/test'

test('MCP tools/list returns 5 tools', async ({ request }) => {
  const r = await request.post('/mcp', {
    data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    headers: { accept: 'application/json, text/event-stream' },
  })
  expect(r.status()).toBe(200)
  const j = await r.json()
  expect(j.result.tools).toHaveLength(5)
})

test('agent-skills index lists 5 mcp-tool entries', async ({ request }) => {
  const r = await request.get('/.well-known/agent-skills/index.json')
  expect(r.status()).toBe(200)
  const j = await r.json()
  expect(j.skills).toHaveLength(5)
  expect(j.skills.every((s: { type: string }) => s.type === 'mcp-tool')).toBe(true)
})
