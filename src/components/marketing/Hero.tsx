export function Hero({ title, lede }: { title: string; lede?: string }) {
  return (
    <section>
      <h1>{title}</h1>
      {lede ? <p>{lede}</p> : null}
    </section>
  )
}
