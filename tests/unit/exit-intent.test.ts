import { describe, expect, it } from 'vitest'
import {
  dialogA11yProps,
  EXIT_INTENT_SESSION_KEY,
  isExitIntent,
  shouldArm,
} from '@/components/marketing/exit-intent-logic'

describe('dialogA11yProps', () => {
  it('produces a labelled modal dialog wiring', () => {
    const p = dialogA11yProps('exit-modal-title')
    expect(p.role).toBe('dialog')
    expect(p['aria-modal']).toBe(true)
    expect(p['aria-labelledby']).toBe('exit-modal-title')
  })
})

describe('isExitIntent', () => {
  it('fires when the cursor leaves through the TOP of the viewport', () => {
    // Mouse moving up and out: clientY <= 0 and relatedTarget null.
    expect(isExitIntent({ clientY: 0, relatedTarget: null })).toBe(true)
    expect(isExitIntent({ clientY: -5, relatedTarget: null })).toBe(true)
  })

  it('does NOT fire for cursor leaving the sides/bottom', () => {
    expect(isExitIntent({ clientY: 300, relatedTarget: null })).toBe(false)
  })

  it('does NOT fire when moving into a child element (relatedTarget set)', () => {
    expect(isExitIntent({ clientY: 0, relatedTarget: {} })).toBe(false)
  })
})

describe('shouldArm', () => {
  it('arms when the session flag is absent', () => {
    expect(shouldArm(null)).toBe(true)
  })

  it('does NOT arm again once shown this session', () => {
    expect(shouldArm('shown')).toBe(false)
  })

  it('exposes a stable session-storage key', () => {
    expect(EXIT_INTENT_SESSION_KEY).toBe('p51:exit-intent-shown')
  })
})
