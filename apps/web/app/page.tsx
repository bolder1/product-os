import Link from 'next/link'
import { Badge, ButtonLink, Card, CardBody, Wordmark } from '@product-os/ui'

const SIGNALS = [
  {
    tone: 'grounded' as const,
    label: 'Grounded',
    body: 'The agent read your product context before it wrote anything.',
  },
  {
    tone: 'drift' as const,
    label: 'Drifted',
    body: 'Something changed since this context was written. Ground says so.',
  },
]

export default function HomePage() {
  return (
    <div className="g-shell">
      <header className="g-site-header">
        <div className="g-container g-site-header-inner">
          <Wordmark />
          <nav className="g-site-nav">
            <Link href="/login">Sign in</Link>
            <ButtonLink href="/signup" variant="primary" size="sm">
              Get started
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main>
        <section className="g-container g-hero">
          <Badge tone="neutral">Pre-release</Badge>
          <h1 className="g-hero-title">
            Your agents know the file.
            <br />
            They don&rsquo;t know the product.
          </h1>
          <p className="g-hero-lede">
            Claude Code, Cursor and Copilot are excellent at the code in front of them and blind to
            why any of it exists. So they invent architecture, contradict decisions you already
            made, and drift from the product you are actually building. Ground is where that context
            lives — structured, queryable, and one MCP call away.
          </p>
          <div className="g-hero-actions">
            <ButtonLink href="/signup" variant="primary" size="lg">
              Start grounding
            </ButtonLink>
            <ButtonLink
              href="https://github.com/bolder1/product-os/blob/main/docs/00-ground.md"
              variant="secondary"
              size="lg"
            >
              Read the thinking
            </ButtonLink>
          </div>
        </section>

        <section className="g-container g-signals">
          {SIGNALS.map((signal) => (
            <Card key={signal.label}>
              <CardBody>
                <Badge tone={signal.tone} dot>
                  {signal.label}
                </Badge>
                <p className="g-signal-body">{signal.body}</p>
              </CardBody>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}
