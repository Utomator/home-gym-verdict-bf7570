import { describe, expect, it } from 'vitest'
import { renderContentSignal } from '@p51/engine'

describe('renderContentSignal', () => {
  it('renders the spec default policy', () => {
    expect(renderContentSignal({ aiTrain: 'no', search: 'yes', aiInput: 'yes' })).toBe(
      'Content-Signal: ai-train=no, search=yes, ai-input=yes',
    )
  })

  it('renders all-no policy', () => {
    expect(renderContentSignal({ aiTrain: 'no', search: 'no', aiInput: 'no' })).toBe(
      'Content-Signal: ai-train=no, search=no, ai-input=no',
    )
  })

  it('renders all-yes policy', () => {
    expect(renderContentSignal({ aiTrain: 'yes', search: 'yes', aiInput: 'yes' })).toBe(
      'Content-Signal: ai-train=yes, search=yes, ai-input=yes',
    )
  })
})
