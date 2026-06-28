import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Known brand primary so we can assert brand-colored bars in the generated SVG.
vi.mock('@/site.config', () => ({
  default: {
    archetype: 'affiliate',
    business: { name: 'Test Co' },
    brand: { palette: { primary: '#16a34a', neutral: 'zinc' } },
  },
}))

import { ChartBlock, RatingsChart, toChartData } from '@/components/marketing/ChartBlock'

const renderChart = (props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(ChartBlock, props as never))
const renderRatings = (props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(RatingsChart, props as never))

describe('ChartBlock component', () => {
  afterEach(() => vi.clearAllMocks())

  it('renders a bar chart with each label, value, and the chart title', () => {
    const html = renderChart({
      block: {
        title: 'Quarterly Signups',
        chartType: 'bar',
        items: [
          { label: 'Q1', value: 120 },
          { label: 'Q2', value: 200 },
          { label: 'Q3', value: 170 },
        ],
      },
    })
    expect(html).toContain('<svg')
    expect(html).toContain('Quarterly Signups')
    // Category labels.
    expect(html).toContain('Q1')
    expect(html).toContain('Q2')
    expect(html).toContain('Q3')
    // Value labels above bars.
    expect(html).toContain('>120<')
    expect(html).toContain('>200<')
  })

  it('paints the site brand primary into the bars', () => {
    const html = renderChart({
      block: {
        chartType: 'bar',
        items: [
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ],
      },
    })
    expect(html.toLowerCase()).toContain('#16a34a')
  })

  it('renders a horizontal comparison chart when chartType=comparison', () => {
    const html = renderChart({
      block: {
        title: 'Editor Ratings',
        chartType: 'comparison',
        max: 5,
        items: [
          { label: 'Acme Pro', value: 4.6 },
          { label: 'Budget Pick', value: 3.9 },
        ],
      },
    })
    expect(html).toContain('Editor Ratings')
    expect(html).toContain('Acme Pro')
    expect(html).toContain('Budget Pick')
    // The bars are rendered as rounded rects (rx=9 track/bar in comparisonBarsSvg).
    expect(html).toContain('rx="9"')
  })

  it('renders nothing when there are no valid data rows', () => {
    const empty = renderChart({ block: { chartType: 'bar', items: [] } })
    expect(empty).toBe('')
    const noLabels = renderChart({
      block: { chartType: 'bar', items: [{ label: '  ', value: 5 }, { value: 3 }] },
    })
    expect(noLabels).toBe('')
  })

  it('toChartData keeps only labeled, finite-valued rows', () => {
    const data = toChartData([
      { label: 'Good', value: 10 },
      { label: '', value: 5 },
      { label: 'NaN', value: Number.NaN },
      { label: 'Trim ', value: 2 },
    ])
    expect(data).toEqual([
      { label: 'Good', value: 10 },
      { label: 'Trim', value: 2 },
    ])
  })
})

describe('RatingsChart (productRoundup-derived)', () => {
  it('renders a 0–5 comparison chart from roundup item ratings', () => {
    const html = renderRatings({
      items: [
        { name: 'Acme Pro', rating: 4.6 },
        { name: 'Budget Pick', rating: 3.9 },
        { name: 'Premium Plus', rating: 4.9 },
      ],
    })
    expect(html).toContain('<svg')
    expect(html).toContain('Ratings at a glance')
    expect(html).toContain('Acme Pro')
    expect(html).toContain('Premium Plus')
  })

  it('renders nothing with fewer than two rated items', () => {
    expect(renderRatings({ items: [{ name: 'Solo', rating: 4.5 }] })).toBe('')
    expect(renderRatings({ items: [{ name: 'Unrated' }, { name: 'Zero', rating: 0 }] })).toBe('')
    expect(renderRatings({ items: [] })).toBe('')
  })
})
