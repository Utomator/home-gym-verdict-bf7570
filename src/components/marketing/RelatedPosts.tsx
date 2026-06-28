import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

type RelatedPost = { title: string; slug: string; excerpt?: string | null }

/**
 * "Continue reading" block rendering up to 3 related posts as real crawlable
 * <Link> cards. Internal links to topically-related content improve crawl depth
 * and keep readers on-site. Returns null when there are no posts to show.
 */
export function RelatedPosts({ posts }: { posts: RelatedPost[] }) {
  const items = posts.filter((p) => p.slug && p.title).slice(0, 3)
  if (items.length === 0) return null
  return (
    <section aria-label="Continue reading">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Continue reading</h2>
      <ul className="mt-8 grid list-none grid-cols-1 gap-6 pl-0 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 no-underline shadow-sm transition-colors hover:border-primary/40"
            >
              <h3 className="text-base font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              {post.excerpt ? (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              ) : null}
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Read more
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
