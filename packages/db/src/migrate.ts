import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/product_os')

async function migrate() {
  console.log('🔧 Running migrations...')
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`
  console.log('  ✓ users.password_hash column ensured')

  // ── pgvector ────────────────────────────────────────────────────────────
  await sql`CREATE EXTENSION IF NOT EXISTS vector`
  console.log('  ✓ pgvector extension ensured')

  // ── Product Memory ──────────────────────────────────────────────────────
  await sql`
    DO $$ BEGIN
      CREATE TYPE memory_asset_status AS ENUM ('queued','parsing','embedding','ready','failed');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `
  await sql`
    DO $$ BEGIN
      CREATE TYPE memory_asset_kind AS ENUM ('pdf','docx','md','txt','image','other');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `
  await sql`
    CREATE TABLE IF NOT EXISTS product_memory_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      kind memory_asset_kind NOT NULL,
      filename TEXT NOT NULL,
      size BIGINT NOT NULL,
      status memory_asset_status NOT NULL DEFAULT 'queued',
      tags JSONB DEFAULT '[]'::jsonb,
      uploaded_by UUID REFERENCES users(id),
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS product_memory_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_id UUID NOT NULL REFERENCES product_memory_assets(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      text TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      source_page INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS product_memory_embeddings (
      chunk_id UUID PRIMARY KEY REFERENCES product_memory_chunks(id) ON DELETE CASCADE,
      embedding vector(1536) NOT NULL
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS product_memory_embeddings_ivfflat
    ON product_memory_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
  `
  console.log('  ✓ product_memory_* tables ensured')

  // ── Plan Mode ───────────────────────────────────────────────────────────
  await sql`
    DO $$ BEGIN
      CREATE TYPE plan_session_status AS ENUM ('in_progress','finalized','abandoned');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `
  await sql`
    CREATE TABLE IF NOT EXISTS plan_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_by UUID REFERENCES users(id),
      status plan_session_status NOT NULL DEFAULT 'in_progress',
      current_step TEXT NOT NULL DEFAULT 'memory',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS plan_answers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES plan_sessions(id) ON DELETE CASCADE,
      question_key TEXT NOT NULL,
      answer JSONB NOT NULL,
      answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS plan_derived_artifacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES plan_sessions(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      payload JSONB NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log('  ✓ plan_mode tables ensured')

  await sql.end()
  console.log('✅ Migration complete')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
