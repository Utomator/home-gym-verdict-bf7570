import { Check, Minus } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

/** A cell value: boolean renders a check/dash; string renders verbatim. */
export type ComparisonValue = boolean | string

export type ComparisonColumn = {
  /** Column heading, e.g. a plan or product name. */
  name: string
  /** Optional sub-line under the column name, e.g. a price. */
  subtitle?: string
  /** Highlights this column as the recommended choice. */
  featured?: boolean
  /** Ribbon text for the featured column, e.g. "Recommended". */
  badge?: string
}

export type ComparisonRow = {
  label: string
  /** One value per column, in the same order as `columns`. */
  values: ComparisonValue[]
}

export type ComparisonTableProps = {
  eyebrow?: string
  heading: string
  description?: string
  columns: ComparisonColumn[]
  rows: ComparisonRow[]
  className?: string
}

function Cell({ value }: { value: ComparisonValue }) {
  if (typeof value === 'boolean') {
    return value ? (
      <>
        <Check className="size-5 text-primary" strokeWidth={2.5} aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <Minus className="size-5 text-muted-foreground/50" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    )
  }
  return <span className="text-sm font-medium text-foreground">{value}</span>
}

/**
 * ComparisonTable — responsive feature comparison with a highlighted "best" column.
 * Desktop: a single grid table. Mobile: one stacked card per column.
 * Token-driven; the featured column is tinted with the brand primary.
 */
export function ComparisonTable({
  eyebrow,
  heading,
  description,
  columns,
  rows,
  className,
}: ComparisonTableProps) {
  return (
    <section className={cn('bg-background py-20 sm:py-28', className)}>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {heading}
          </h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-prose text-pretty text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {/* Desktop / tablet: aligned grid table */}
        <div className="mt-16 hidden md:block">
          <div
            className="grid items-stretch overflow-hidden rounded-2xl border border-border"
            style={{ gridTemplateColumns: `minmax(0,1.4fr) repeat(${columns.length}, minmax(0,1fr))` }}
          >
            {/* Header row */}
            <div className="border-b border-border bg-muted/40" aria-hidden="true" />
            {columns.map((col) => (
              <div
                key={col.name}
                className={cn(
                  'relative border-b border-l border-border px-5 py-5 text-center',
                  col.featured ? 'bg-primary/5' : 'bg-muted/40',
                )}
              >
                {col.featured && col.badge ? (
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary">
                    {col.badge}
                  </span>
                ) : null}
                <span className="block text-base font-semibold text-foreground">
                  {col.name}
                </span>
                {col.subtitle ? (
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {col.subtitle}
                  </span>
                ) : null}
              </div>
            ))}

            {/* Body rows */}
            {rows.map((row, rowIndex) => {
              const last = rowIndex === rows.length - 1
              return (
                <div key={row.label} className="contents">
                  <div
                    className={cn(
                      'flex items-center px-5 py-4 text-sm font-medium text-foreground',
                      !last && 'border-b border-border',
                    )}
                  >
                    {row.label}
                  </div>
                  {row.values.map((value, colIndex) => {
                    const col = columns[colIndex]
                    return (
                      <div
                        key={col.name}
                        className={cn(
                          'flex items-center justify-center border-l border-border px-5 py-4',
                          col.featured && 'bg-primary/5',
                          !last && 'border-b',
                        )}
                      >
                        <Cell value={value} />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: stacked card per column */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:hidden">
          {columns.map((col, colIndex) => (
            <div
              key={col.name}
              className={cn(
                'rounded-2xl border p-6',
                col.featured
                  ? 'border-primary bg-card ring-1 ring-primary'
                  : 'border-border bg-card',
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-card-foreground">{col.name}</h3>
                  {col.subtitle ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">{col.subtitle}</p>
                  ) : null}
                </div>
                {col.featured && col.badge ? (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    {col.badge}
                  </span>
                ) : null}
              </div>

              <dl className="mt-4 divide-y divide-border">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="flex items-center">
                      <Cell value={row.values[colIndex]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
