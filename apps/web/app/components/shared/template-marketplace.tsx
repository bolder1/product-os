'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BlueprintIllustration } from './blueprint-illustration'
import {
  Store,
  Search,
  Download,
  Star,
  Eye,
  X,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  Users,
  BarChart3,
  Briefcase,
  Headphones,
  GraduationCap,
  Bot,
  ShoppingBag,
  Database,
  Code2,
  Wallet,
  MessageSquare,
  Shield,
  Gauge,
  FolderKanban,
  Boxes,
  ArrowUpRight,
  Grid3x3,
  List,
  Expand,
  Zap,
  TrendingUp,
  ArrowRight,
  Flame,
  Filter,
  Compass,
  Palette,
  Component,
  Workflow as WorkflowIcon,
  FileText,
  Image as ImageIcon,
  Activity,
  Wand2,
  Plug,
  Network,
  CircuitBoard,
  Rocket,
  ThumbsUp,
  Info,
  Cpu,
  GitBranch,
  Smartphone,
  Globe,
  Send,
  Clock,
  Lightbulb,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types — focused on WEB APP IDEAS, not websites
// ---------------------------------------------------------------------------

export type AppCategory =
  | 'saas-app'
  | 'internal-tool'
  | 'admin-panel'
  | 'dashboard'
  | 'crm'
  | 'pm-tool'
  | 'ai-app'
  | 'collab'
  | 'data-app'
  | 'dev-tool'
  | 'finance'
  | 'hr-app'
  | 'support'
  | 'edu-app'
  | 'ecom-ops'
  | 'marketplace'
  | 'community'

export type Complexity = 'starter' | 'pro' | 'enterprise'
export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop'

// Studios a blueprint deploys into — matches Product OS's 26-studio model.
// Each key maps to a Creation Studio (or core system) that lights up
// when the blueprint is installed.
export type StudioKey =
  | 'planner'       // Product Planner
  | 'canvas'        // Canvas Planner
  | 'brand'         // Brand Builder
  | 'components'    // Component Builder
  | 'design'        // Design Studio
  | 'workflow'      // Workflow / Ops Builder
  | 'pages'         // Page / Site Builder
  | 'code'          // Code Studio
  | 'graphics'      // Graphics Studio
  | 'analytics'     // Analytics Builder
  | 'handoff'       // Dev Handoff
  | 'test'          // Test Center
  | 'skills'        // AI Skills (Intelligence layer)
  | 'connectors'    // Integrations/Connectors

export interface BlueprintShips {
  pages: number
  entities: number
  workflows: number
  components: number
  tokens: number
  skills: number
  connectors: number
  events: number
}

// Kept for back-compat with any callers still typed against the old union
export type TemplateCategory = AppCategory

export interface MarketplaceTemplate {
  id: string
  name: string
  tagline: string
  description: string
  category: AppCategory
  author: string
  downloads: number
  rating: number
  tags: string[]
  preview: string
  nodeCount: number
  edgeCount: number
  responsive: boolean
  breakpoints: Breakpoint[]
  complexity: Complexity
  stack: string[]
  icon: string
  gradient: [string, string]
  featured?: boolean
  isNew?: boolean
  trending?: boolean
  /** Multi-studio bundle — which studios light up on install */
  studios: StudioKey[]
  /** Concrete artifacts the blueprint generates in the product graph */
  ships: BlueprintShips
  /** AI Remix prompt suggestions — natural-language tweaks users can apply */
  aiRemix: string[]
}

const ALL_BREAKPOINTS: Breakpoint[] = ['mobile', 'tablet', 'laptop', 'desktop']

// ---------------------------------------------------------------------------
// App-idea generator — 100+ WEB APP templates across 17 categories
// ---------------------------------------------------------------------------

interface CategorySpec {
  category: AppCategory
  tagPool: string[]
  stack: string[]
  gradient: [string, string]
  ideas: Array<{ name: string; tagline: string; icon: string }>
}

const CATEGORY_SPECS: CategorySpec[] = [
  {
    category: 'saas-app',
    tagPool: ['auth', 'billing', 'multi-tenant', 'b2b', 'workspace', 'roles'],
    stack: ['Next.js', 'tRPC', 'Postgres', 'Stripe'],
    gradient: ['#3B82F6', '#8B5CF6'],
    ideas: [
      { name: 'B2B SaaS Starter', tagline: 'Auth, billing, roles, workspaces', icon: '🚀' },
      { name: 'Team Workspace', tagline: 'Multi-tenant app shell with billing', icon: '🏢' },
      { name: 'Feedback Portal', tagline: 'Roadmap, voting, changelog', icon: '💡' },
      { name: 'Knowledge Base', tagline: 'Searchable docs with AI answers', icon: '📚' },
      { name: 'Scheduling App', tagline: 'Calendly-style booking SaaS', icon: '📅' },
      { name: 'Webinar Platform', tagline: 'Live + replays with registration', icon: '🎥' },
      { name: 'Meeting Notes', tagline: 'Agenda, notes, action items', icon: '📝' },
      { name: 'Link Shortener SaaS', tagline: 'Analytics + QR + UTM', icon: '🔗' },
    ],
  },
  {
    category: 'internal-tool',
    tagPool: ['internal', 'workflows', 'approvals', 'forms', 'automation'],
    stack: ['Next.js', 'tRPC', 'Postgres'],
    gradient: ['#06B6D4', '#3B82F6'],
    ideas: [
      { name: 'Ops Console', tagline: 'Unified command center for ops', icon: '🎛️' },
      { name: 'Approval Hub', tagline: 'Multi-stage review workflows', icon: '✅' },
      { name: 'Content Moderation', tagline: 'Queue, flags, rules engine', icon: '🛡️' },
      { name: 'IT Ticketing', tagline: 'Internal helpdesk app', icon: '🎫' },
      { name: 'Procurement Tool', tagline: 'Vendor, PO, budget approvals', icon: '📦' },
      { name: 'Inventory Tracker', tagline: 'SKUs, stock, reorder alerts', icon: '📊' },
      { name: 'Employee Directory', tagline: 'Org chart, profiles, search', icon: '👥' },
      { name: 'Runbook Tool', tagline: 'On-call playbooks and incidents', icon: '🚨' },
    ],
  },
  {
    category: 'admin-panel',
    tagPool: ['admin', 'users', 'roles', 'audit', 'rbac', 'super-admin'],
    stack: ['Next.js', 'Postgres', 'Lucia'],
    gradient: ['#F43F5E', '#EC4899'],
    ideas: [
      { name: 'Super Admin Panel', tagline: 'Manage users, roles, audits', icon: '👑' },
      { name: 'Role & Permissions', tagline: 'RBAC editor with policy preview', icon: '🔐' },
      { name: 'Audit Log Viewer', tagline: 'Searchable activity stream', icon: '📜' },
      { name: 'Feature Flag Admin', tagline: 'Targeted rollouts with cohorts', icon: '🚩' },
      { name: 'Billing Admin', tagline: 'Subscriptions, invoices, refunds', icon: '💳' },
      { name: 'Workspace Admin', tagline: 'Tenant switching + impersonation', icon: '🏗️' },
      { name: 'Access Requests', tagline: 'Just-in-time access approvals', icon: '🔑' },
    ],
  },
  {
    category: 'dashboard',
    tagPool: ['charts', 'kpi', 'real-time', 'metrics', 'data-viz'],
    stack: ['Next.js', 'Recharts', 'ClickHouse'],
    gradient: ['#10B981', '#06B6D4'],
    ideas: [
      { name: 'Analytics Dashboard', tagline: 'Funnels, retention, segments', icon: '📈' },
      { name: 'Finance Dashboard', tagline: 'Revenue, MRR, churn, runway', icon: '💰' },
      { name: 'Ops Command Center', tagline: 'Live KPIs and alerts', icon: '🎯' },
      { name: 'Customer Health', tagline: 'Scores, risks, expansion signals', icon: '❤️' },
      { name: 'Marketing Attribution', tagline: 'Multi-touch channel view', icon: '📣' },
      { name: 'Sales Pipeline', tagline: 'Deal stages, forecast, velocity', icon: '🧭' },
      { name: 'Product Usage', tagline: 'Feature adoption heatmaps', icon: '🔥' },
      { name: 'Executive Scorecard', tagline: 'North-star KPIs at a glance', icon: '🏁' },
    ],
  },
  {
    category: 'crm',
    tagPool: ['crm', 'sales', 'contacts', 'pipeline', 'outreach'],
    stack: ['Next.js', 'Postgres', 'Resend'],
    gradient: ['#8B5CF6', '#EC4899'],
    ideas: [
      { name: 'Modern CRM', tagline: 'Contacts, deals, activities', icon: '🤝' },
      { name: 'Lead Routing App', tagline: 'Round-robin + territory rules', icon: '🎯' },
      { name: 'Outreach Cadence', tagline: 'Multi-channel sequences', icon: '📨' },
      { name: 'Account Playbook', tagline: 'Plays, triggers, intent signals', icon: '📘' },
      { name: 'Sales Coach', tagline: 'Call review and coaching notes', icon: '🎙️' },
    ],
  },
  {
    category: 'pm-tool',
    tagPool: ['projects', 'tasks', 'kanban', 'sprints', 'gantt'],
    stack: ['Next.js', 'Postgres', 'tRPC'],
    gradient: ['#F59E0B', '#EF4444'],
    ideas: [
      { name: 'Linear-style Tracker', tagline: 'Issues, cycles, projects', icon: '⚡' },
      { name: 'Sprint Planner', tagline: 'Backlog, velocity, standups', icon: '🏃' },
      { name: 'Roadmap App', tagline: 'Timeline, dependencies, releases', icon: '🗺️' },
      { name: 'Bug Tracker', tagline: 'Triage, severity, regressions', icon: '🐛' },
      { name: 'OKR Tracker', tagline: 'Objectives, key results, check-ins', icon: '🎯' },
      { name: 'Task Board', tagline: 'Kanban with swimlanes', icon: '📋' },
      { name: 'Dependency Graph', tagline: 'Visualize cross-team blockers', icon: '🕸️' },
    ],
  },
  {
    category: 'ai-app',
    tagPool: ['ai', 'llm', 'rag', 'agents', 'copilot'],
    stack: ['Next.js', 'Anthropic', 'Pinecone'],
    gradient: ['#A855F7', '#6366F1'],
    ideas: [
      { name: 'AI Chat App', tagline: 'Multi-turn chat with citations', icon: '💬' },
      { name: 'RAG Knowledge App', tagline: 'Upload docs, query with AI', icon: '🧠' },
      { name: 'AI Writing Studio', tagline: 'Drafts, edits, tone presets', icon: '✍️' },
      { name: 'AI Agent Builder', tagline: 'Tools, memory, guardrails', icon: '🤖' },
      { name: 'Prompt Library', tagline: 'Versioned prompts with eval', icon: '🧪' },
      { name: 'AI Research Assistant', tagline: 'Web search + synthesis', icon: '🔎' },
      { name: 'AI Meeting Summarizer', tagline: 'Transcripts, TLDR, actions', icon: '🎧' },
      { name: 'AI Copilot Shell', tagline: 'Side panel for any app', icon: '✨' },
    ],
  },
  {
    category: 'collab',
    tagPool: ['realtime', 'presence', 'comments', 'workspace', 'yjs'],
    stack: ['Next.js', 'Liveblocks', 'Yjs'],
    gradient: ['#0EA5E9', '#14B8A6'],
    ideas: [
      { name: 'Realtime Whiteboard', tagline: 'Multiplayer canvas + cursors', icon: '🎨' },
      { name: 'Docs with Comments', tagline: 'Notion-style collab editor', icon: '📄' },
      { name: 'Team Chat App', tagline: 'Channels, threads, mentions', icon: '💭' },
      { name: 'Pair Review Tool', tagline: 'Side-by-side comments', icon: '👀' },
      { name: 'Shared Inbox', tagline: 'Team triage on one queue', icon: '📥' },
      { name: 'Design Critique', tagline: 'Pin comments on artboards', icon: '🖼️' },
    ],
  },
  {
    category: 'data-app',
    tagPool: ['tables', 'queries', 'sql', 'etl', 'lineage'],
    stack: ['Next.js', 'DuckDB', 'Arrow'],
    gradient: ['#64748B', '#475569'],
    ideas: [
      { name: 'SQL Notebook', tagline: 'Query, chart, share', icon: '📓' },
      { name: 'Data Catalog', tagline: 'Tables, columns, lineage', icon: '🗂️' },
      { name: 'Reverse ETL App', tagline: 'Warehouse → SaaS syncs', icon: '🔁' },
      { name: 'Metrics Layer', tagline: 'Semantic definitions + tests', icon: '📐' },
      { name: 'Data Quality Monitor', tagline: 'Freshness, volume, schema', icon: '🔬' },
      { name: 'Spreadsheet App', tagline: 'Formulas + live data sources', icon: '📑' },
    ],
  },
  {
    category: 'dev-tool',
    tagPool: ['ci', 'deploys', 'logs', 'apis', 'devex'],
    stack: ['Next.js', 'OpenAPI', 'Postgres'],
    gradient: ['#1F2937', '#3B82F6'],
    ideas: [
      { name: 'API Explorer', tagline: 'Try endpoints, save requests', icon: '🛰️' },
      { name: 'Deploy Dashboard', tagline: 'Builds, previews, rollbacks', icon: '🚀' },
      { name: 'Log Viewer', tagline: 'Structured search + tail', icon: '🪵' },
      { name: 'Error Tracker', tagline: 'Issues, breadcrumbs, sessions', icon: '🧯' },
      { name: 'Feature Flags App', tagline: 'Targeting, gradual rollouts', icon: '🎚️' },
      { name: 'Webhook Console', tagline: 'Inspect, replay, sign', icon: '🪝' },
      { name: 'Env Config Manager', tagline: 'Vars, secrets, versions', icon: '🧩' },
    ],
  },
  {
    category: 'finance',
    tagPool: ['billing', 'invoices', 'payments', 'plans', 'usage'],
    stack: ['Next.js', 'Stripe', 'Postgres'],
    gradient: ['#10B981', '#059669'],
    ideas: [
      { name: 'Subscription Billing', tagline: 'Plans, trials, upgrades', icon: '💎' },
      { name: 'Usage-Based Billing', tagline: 'Metered events + overage', icon: '⏱️' },
      { name: 'Invoice Manager', tagline: 'Draft, send, reconcile', icon: '🧾' },
      { name: 'Expense Tracker', tagline: 'Receipts, approvals, reports', icon: '💸' },
      { name: 'Budget Planner', tagline: 'Categories, alerts, forecasts', icon: '🏦' },
      { name: 'Payroll Lite', tagline: 'Runs, pay stubs, tax exports', icon: '💼' },
    ],
  },
  {
    category: 'hr-app',
    tagPool: ['hr', 'people', 'onboarding', 'reviews', 'leave'],
    stack: ['Next.js', 'Postgres', 'Resend'],
    gradient: ['#EC4899', '#F43F5E'],
    ideas: [
      { name: 'Applicant Tracker', tagline: 'Candidates, stages, scorecards', icon: '🧑‍💼' },
      { name: 'Employee Onboarding', tagline: 'Checklists, docs, buddy pairing', icon: '🎉' },
      { name: 'Performance Reviews', tagline: '360° feedback cycles', icon: '📋' },
      { name: 'PTO & Leave', tagline: 'Requests, balances, calendar', icon: '🏖️' },
      { name: 'Org Chart App', tagline: 'Interactive hierarchy viewer', icon: '🌳' },
      { name: 'Compensation Planner', tagline: 'Bands, equity, merit cycles', icon: '💵' },
    ],
  },
  {
    category: 'support',
    tagPool: ['support', 'tickets', 'help-center', 'chat', 'nps'],
    stack: ['Next.js', 'Postgres', 'Pusher'],
    gradient: ['#F97316', '#F59E0B'],
    ideas: [
      { name: 'Helpdesk App', tagline: 'Tickets, SLAs, macros', icon: '🎫' },
      { name: 'Live Chat Inbox', tagline: 'Agent cockpit with routing', icon: '💬' },
      { name: 'Help Center Portal', tagline: 'Articles, search, AI answers', icon: '🆘' },
      { name: 'Customer Feedback', tagline: 'NPS, CSAT, open-ended', icon: '⭐' },
      { name: 'Status Page App', tagline: 'Incidents + subscribers', icon: '🟢' },
    ],
  },
  {
    category: 'edu-app',
    tagPool: ['lms', 'courses', 'quizzes', 'cohorts', 'certifications'],
    stack: ['Next.js', 'Postgres', 'Mux'],
    gradient: ['#6366F1', '#A855F7'],
    ideas: [
      { name: 'LMS Platform', tagline: 'Courses, lessons, progress', icon: '🎓' },
      { name: 'Cohort Course App', tagline: 'Live sessions + community', icon: '👥' },
      { name: 'Quiz Builder', tagline: 'Branching questions + scoring', icon: '📝' },
      { name: 'Certification Tracker', tagline: 'Badges, paths, renewals', icon: '🏅' },
      { name: 'Flashcard App', tagline: 'Spaced repetition + decks', icon: '🔖' },
    ],
  },
  {
    category: 'ecom-ops',
    tagPool: ['orders', 'fulfillment', 'returns', 'catalog', 'shopify'],
    stack: ['Next.js', 'Postgres', 'Shopify'],
    gradient: ['#14B8A6', '#10B981'],
    ideas: [
      { name: 'Order Management', tagline: 'Orders, holds, edits, refunds', icon: '📦' },
      { name: 'Fulfillment Console', tagline: 'Pick, pack, ship tracking', icon: '🚚' },
      { name: 'Returns Portal', tagline: 'RMAs, restock, refunds', icon: '↩️' },
      { name: 'Product Catalog', tagline: 'PIM with variants + media', icon: '🏷️' },
      { name: 'Storefront Admin', tagline: 'Back office for a shop', icon: '🛒' },
      { name: 'Abandoned Cart Ops', tagline: 'Segments, campaigns, recovery', icon: '🛍️' },
    ],
  },
  {
    category: 'marketplace',
    tagPool: ['two-sided', 'listings', 'messaging', 'payouts', 'reviews'],
    stack: ['Next.js', 'Stripe Connect', 'Postgres'],
    gradient: ['#D946EF', '#8B5CF6'],
    ideas: [
      { name: 'Services Marketplace', tagline: 'Listings, bookings, payouts', icon: '🛠️' },
      { name: 'Talent Marketplace', tagline: 'Profiles, proposals, escrow', icon: '🧑‍🎨' },
      { name: 'Rental Marketplace', tagline: 'Calendar-based availability', icon: '🔑' },
      { name: 'Course Marketplace', tagline: 'Instructors + learners', icon: '📚' },
      { name: 'Handmade Goods', tagline: 'Multi-vendor commerce app', icon: '🧵' },
      { name: 'B2B Marketplace', tagline: 'Buyer RFQs + vendor quotes', icon: '🏭' },
    ],
  },
  {
    category: 'community',
    tagPool: ['posts', 'forums', 'events', 'gamification', 'profiles'],
    stack: ['Next.js', 'Postgres', 'Pusher'],
    gradient: ['#0891B2', '#22D3EE'],
    ideas: [
      { name: 'Community Forum', tagline: 'Topics, replies, reactions', icon: '🗣️' },
      { name: 'Member Hub', tagline: 'Profiles, posts, direct messages', icon: '👋' },
      { name: 'Events App', tagline: 'RSVPs, tickets, schedules', icon: '🎪' },
      { name: 'Q&A Platform', tagline: 'StackOverflow-style Q&A', icon: '❓' },
      { name: 'Ambassador Program', tagline: 'Perks, leaderboard, tiers', icon: '🏆' },
    ],
  },
]

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Studio Footprint + What Ships derivation
// ---------------------------------------------------------------------------

// Base set of studios every blueprint touches (the minimum ProductOS graph).
const BASE_STUDIOS: StudioKey[] = ['planner', 'canvas', 'brand', 'design', 'pages', 'components']

// Category → extra studios that light up on top of the base set.
const CATEGORY_STUDIOS: Record<AppCategory, StudioKey[]> = {
  'saas-app':      ['workflow', 'analytics', 'skills', 'connectors', 'handoff', 'code', 'test'],
  'internal-tool': ['workflow', 'connectors', 'handoff', 'test'],
  'admin-panel':   ['workflow', 'analytics', 'handoff', 'test'],
  'dashboard':     ['analytics', 'connectors', 'skills'],
  'crm':           ['workflow', 'connectors', 'analytics', 'skills'],
  'pm-tool':       ['workflow', 'analytics', 'handoff'],
  'ai-app':        ['skills', 'workflow', 'connectors', 'analytics'],
  'collab':        ['workflow', 'skills', 'analytics'],
  'data-app':      ['analytics', 'connectors', 'skills'],
  'dev-tool':      ['workflow', 'connectors', 'handoff', 'code'],
  'finance':       ['workflow', 'connectors', 'analytics'],
  'hr-app':        ['workflow', 'connectors', 'analytics'],
  'support':       ['workflow', 'skills', 'connectors', 'analytics'],
  'edu-app':       ['workflow', 'analytics', 'graphics'],
  'ecom-ops':      ['workflow', 'connectors', 'analytics'],
  'marketplace':   ['workflow', 'connectors', 'analytics', 'skills'],
  'community':     ['workflow', 'skills', 'graphics'],
}

function deriveStudios(category: AppCategory, complexity: Complexity): StudioKey[] {
  const extras = CATEGORY_STUDIOS[category] ?? []
  // Starter blueprints keep the core studios only; pro adds half of extras; enterprise adds all.
  const take =
    complexity === 'enterprise' ? extras.length :
    complexity === 'pro' ? Math.ceil(extras.length * 0.7) :
    Math.ceil(extras.length * 0.4)
  const extraSlice = extras.slice(0, take)
  // Deduplicate while preserving order
  const seen = new Set<StudioKey>()
  const out: StudioKey[] = []
  for (const s of [...BASE_STUDIOS, ...extraSlice]) {
    if (!seen.has(s)) { seen.add(s); out.push(s) }
  }
  return out
}

function deriveShips(
  category: AppCategory,
  complexity: Complexity,
  nodeCount: number,
  rand: () => number,
): BlueprintShips {
  const k = complexity === 'enterprise' ? 1.5 : complexity === 'pro' ? 1.15 : 0.8
  const extra = CATEGORY_STUDIOS[category] ?? []
  const has = (s: StudioKey) => extra.includes(s)
  return {
    pages:       Math.max(4, Math.round((6 + rand() * 10) * k)),
    entities:    Math.max(3, Math.round((4 + rand() * 8) * k)),
    workflows:   has('workflow')   ? Math.max(2, Math.round((3 + rand() * 6) * k)) : 0,
    components: Math.max(6, Math.round(nodeCount * 0.35)),
    tokens:      Math.max(12, Math.round((18 + rand() * 30) * k)),
    skills:      has('skills')     ? Math.max(1, Math.round((2 + rand() * 5) * k)) : 0,
    connectors:  has('connectors') ? Math.max(1, Math.round((1 + rand() * 4) * k)) : 0,
    events:      has('analytics')  ? Math.max(4, Math.round((6 + rand() * 14) * k)) : 0,
  }
}

const CATEGORY_REMIX: Record<AppCategory, string[]> = {
  'saas-app':      ['Add team plans', 'Switch billing to usage-based', 'Add SSO + SCIM', 'Use our brand tokens'],
  'internal-tool': ['Add approval workflow', 'Export to CSV + Slack', 'Make it multi-tenant'],
  'admin-panel':   ['Add impersonation + audit', 'Split into super-admin + workspace-admin', 'Add feature flags'],
  'dashboard':     ['Swap charts to our KPIs', 'Add drill-downs + cohorts', 'Pipe data from Snowflake'],
  'crm':           ['Add territory routing', 'Wire HubSpot + Salesforce sync', 'Pipe calls from Gong'],
  'pm-tool':       ['Make it Linear-like', 'Add dependencies + roadmaps', 'Sync with Jira + GitHub'],
  'ai-app':        ['Swap to Claude 4.7', 'Add RAG over our docs', 'Add tool-use with guardrails'],
  'collab':        ['Add realtime cursors', 'Pipe to Slack + email', 'Add threaded comments'],
  'data-app':      ['Connect to Postgres + DuckDB', 'Add lineage + data quality tests', 'Add notebook chat'],
  'dev-tool':      ['Add deploy previews', 'Pipe CI status from GitHub', 'Add log tailing + alerts'],
  'finance':       ['Switch to Stripe Connect', 'Add tax + multi-currency', 'Wire invoice PDFs'],
  'hr-app':        ['Add ATS with scorecards', 'Wire BambooHR + Greenhouse', 'Add PTO calendar'],
  'support':       ['Add AI triage + macros', 'Wire Zendesk + Intercom', 'Add status page'],
  'edu-app':       ['Add cohorts + live sessions', 'Add quizzes + certifications', 'Pipe video via Mux'],
  'ecom-ops':      ['Wire Shopify + Stripe', 'Add returns + RMAs', 'Add multi-warehouse'],
  'marketplace':   ['Add escrow payouts', 'Add dual-sided reviews', 'Add verified seller flow'],
  'community':     ['Add gamification + badges', 'Wire Discord + Circle', 'Add events + RSVPs'],
}

// Use Cases — showcase what kinds of real apps users can build with a template.
// Each category has 3-4 prioritized use cases; the first entry is the "primary"
// best-fit, rendered as a featured card.
interface UseCase {
  title: string
  description: string
  examples: string[]
  priority?: 'high' | 'medium'
}

const CATEGORY_USE_CASES: Record<AppCategory, UseCase[]> = {
  'saas-app': [
    { priority: 'high', title: 'B2B SaaS MVP', description: 'Spin up a multi-tenant product with auth, billing, and a workspace shell in a weekend.', examples: ['Linear for dentists', 'Notion for operations', 'Slack for real estate'] },
    { priority: 'medium', title: 'Internal tool sold externally', description: 'Turn an ops tool into a paid product — add tenants, usage limits, and per-seat billing.', examples: ['QA test runner', 'Feedback aggregator', 'Changelog publisher'] },
    { title: 'Niche workflow SaaS', description: 'Verticalize your SaaS for a specific industry with deep ICP workflows.', examples: ['Law firm intake', 'Agency time tracker', 'Construction RFP manager'] },
  ],
  'internal-tool': [
    { priority: 'high', title: 'Ops command center', description: 'Give your operations team a single screen to approve, review, and escalate work.', examples: ['Payment approvals', 'Refund queue', 'Account health triage'] },
    { priority: 'medium', title: 'Back-office CRUD app', description: 'Replace fragile spreadsheets with a proper UI over your internal database.', examples: ['Vendor directory', 'Asset tracker', 'Policy manager'] },
    { title: 'Workflow orchestrator', description: 'Wire together approvals, notifications, and audit logs across your org.', examples: ['Leave approvals', 'Access requests', 'Budget approvals'] },
  ],
  'admin-panel': [
    { priority: 'high', title: 'Super-admin console', description: 'Manage your entire customer base — users, roles, subscriptions, and audit trails.', examples: ['Impersonation flows', 'Role editor', 'Org-wide audit log'] },
    { priority: 'medium', title: 'Workspace admin UI', description: 'Give customers their own admin to manage members, billing, and settings.', examples: ['Member invites', 'Plan upgrades', 'API key management'] },
    { title: 'Support agent toolkit', description: 'Empower support with read-only access, safe write actions, and full audit logs.', examples: ['Account lookup', 'Refund issuance', 'Ticket escalation'] },
  ],
  'dashboard': [
    { priority: 'high', title: 'Executive KPI dashboard', description: 'Present MRR, churn, CAC, retention, and north-star metrics at a glance.', examples: ['CEO dashboard', 'Board snapshot', 'Investor update view'] },
    { priority: 'medium', title: 'Product usage analytics', description: 'Track feature adoption, funnels, and cohorts to inform roadmap decisions.', examples: ['Feature heatmap', 'Onboarding funnel', 'Retention cohorts'] },
    { title: 'Customer-facing reporting', description: 'Ship a white-labeled reporting surface inside your own product.', examples: ['Agency client dashboard', 'Partner portal metrics', 'Customer usage page'] },
  ],
  'crm': [
    { priority: 'high', title: 'Outbound sales CRM', description: 'A lightweight CRM focused on cadences, deals, and call coaching for lean teams.', examples: ['Founder-led sales', 'SDR pod CRM', 'Partnerships tracker'] },
    { priority: 'medium', title: 'Customer success CRM', description: 'Track accounts, renewals, and health scores for post-sale teams.', examples: ['Account reviews', 'QBR prep', 'Churn risk board'] },
    { title: 'Partner / channel CRM', description: 'Manage resellers, referrals, and co-sell deals with attribution.', examples: ['Referral tracking', 'Co-sell pipeline', 'Partner QBRs'] },
  ],
  'pm-tool': [
    { priority: 'high', title: 'Internal issue tracker', description: 'A fast, opinionated alternative to Jira that matches how your team actually ships.', examples: ['Eng tracker', 'Design backlog', 'Bug triage'] },
    { priority: 'medium', title: 'Company-wide roadmap', description: 'One roadmap across product, marketing, and ops — with dependencies.', examples: ['Quarterly plan', 'Launch calendar', 'OKR board'] },
    { title: 'Cross-team program manager', description: 'Orchestrate complex initiatives spanning multiple squads.', examples: ['Platform migration', 'Re-platform', 'Compliance project'] },
  ],
  'ai-app': [
    { priority: 'high', title: 'AI copilot for your product', description: 'Drop an AI side panel into your existing product that knows your data.', examples: ['Analytics copilot', 'Support assistant', 'Ops sidekick'] },
    { priority: 'medium', title: 'Internal knowledge assistant', description: 'Let your team chat with company docs, wikis, and runbooks.', examples: ['Onboarding bot', 'IT helpdesk agent', 'Sales enablement bot'] },
    { title: 'Standalone AI product', description: 'A focused, chat-first app for a specific workflow or audience.', examples: ['AI resume reviewer', 'AI proposal writer', 'AI research agent'] },
  ],
  'collab': [
    { priority: 'high', title: 'Multiplayer canvas app', description: 'Realtime whiteboards, docs, or canvases with presence and comments.', examples: ['Design reviews', 'Strategy whiteboards', 'Incident warrooms'] },
    { priority: 'medium', title: 'Team docs with threading', description: 'Notion-style docs with inline comments, mentions, and resolved threads.', examples: ['PRDs', 'Engineering RFCs', 'Meeting notes'] },
    { title: 'Shared inbox for teams', description: 'One queue for support@, ops@, or sales@ mailboxes with triage and assignments.', examples: ['Support inbox', 'Ops triage', 'Partnership inbox'] },
  ],
  'data-app': [
    { priority: 'high', title: 'Internal data explorer', description: 'Let analysts and PMs query, chart, and share insights without SQL gymnastics.', examples: ['SQL notebook', 'Ad-hoc query UI', 'Insights shareboard'] },
    { priority: 'medium', title: 'Data catalog / lineage', description: 'Give the whole org a map of tables, columns, owners, and freshness.', examples: ['Table discovery', 'Column lineage', 'Deprecation tracker'] },
    { title: 'Metrics layer UI', description: 'Browse, edit, and certify metric definitions with tests.', examples: ['Finance metrics', 'Product metrics', 'Marketing KPIs'] },
  ],
  'dev-tool': [
    { priority: 'high', title: 'Internal devex portal', description: 'Unify deploys, feature flags, API keys, and docs for your engineers.', examples: ['Deploy dashboard', 'API explorer', 'Service catalog'] },
    { priority: 'medium', title: 'Observability UI', description: 'Ship logs, errors, and traces tailored to your stack.', examples: ['Log tail', 'Error triage', 'Webhook inspector'] },
    { title: 'SaaS for developers', description: 'Package a dev tool as an external product with billing and orgs.', examples: ['CI add-on', 'Flag service', 'Log router'] },
  ],
  'finance': [
    { priority: 'high', title: 'Embedded billing UI', description: 'Subscriptions, invoices, receipts, and dunning — fully branded inside your app.', examples: ['SaaS billing page', 'Usage invoices', 'Dunning flows'] },
    { priority: 'medium', title: 'Expense / approval tool', description: 'Track spend, route approvals, and sync with accounting.', examples: ['Reimbursements', 'Vendor spend', 'Card program'] },
    { title: 'Fintech product', description: 'A ledger-backed consumer or B2B fintech experience.', examples: ['Neobank UI', 'Invoicing SaaS', 'Escrow product'] },
  ],
  'hr-app': [
    { priority: 'high', title: 'Applicant tracking', description: 'Pipeline, scorecards, and structured interviews for early-stage teams.', examples: ['Eng hiring pipeline', 'Design scorecards', 'Offer workflow'] },
    { priority: 'medium', title: 'People ops hub', description: 'Profiles, PTO, org chart, and onboarding checklists.', examples: ['Onboarding flow', 'PTO calendar', 'Org chart'] },
    { title: 'Performance reviews', description: 'Review cycles, feedback, and calibration rounds.', examples: ['360 reviews', 'Promotion packets', 'Career ladders'] },
  ],
  'support': [
    { priority: 'high', title: 'AI-assisted helpdesk', description: 'Tickets with AI triage, suggested replies, and macros.', examples: ['Product support', 'IT helpdesk', 'Concierge support'] },
    { priority: 'medium', title: 'Customer portal', description: 'Self-serve knowledge base + ticket submission for customers.', examples: ['Docs site', 'Community Q&A', 'Ticket portal'] },
    { title: 'Incident comms', description: 'Public status page + internal incident command.', examples: ['Status page', 'Incident runbook', 'Postmortem archive'] },
  ],
  'edu-app': [
    { priority: 'high', title: 'Cohort-based courses', description: 'Lessons, live sessions, assignments, and peer reviews.', examples: ['Bootcamp', 'Executive program', 'Internal training'] },
    { priority: 'medium', title: 'Certification platform', description: 'Quizzes, proctoring, and verifiable credentials.', examples: ['Product certification', 'Tool training', 'Partner enablement'] },
    { title: 'Self-paced learning', description: 'Video courses, progress tracking, and a library UI.', examples: ['Course library', 'Workshop archive', 'Onboarding academy'] },
  ],
  'ecom-ops': [
    { priority: 'high', title: 'Merchant ops console', description: 'Orders, returns, customers, and inventory in one back office.', examples: ['DTC back office', 'Wholesale portal', 'Returns desk'] },
    { priority: 'medium', title: 'Multi-channel inventory', description: 'Sync stock across Shopify, Amazon, and your own storefront.', examples: ['Stock sync', 'Reorder alerts', 'Multi-warehouse'] },
    { title: 'Subscriptions / replenishment', description: 'Subscription commerce with pause, swap, and skip flows.', examples: ['Box subscription', 'Consumables refill', 'Membership tier'] },
  ],
  'marketplace': [
    { priority: 'high', title: 'Two-sided marketplace', description: 'Supply + demand with verified listings, messaging, and payouts.', examples: ['Freelance marketplace', 'Rentals app', 'Local services'] },
    { priority: 'medium', title: 'Digital goods store', description: 'Creators sell templates, presets, courses — with escrow payouts.', examples: ['Template store', 'Asset pack shop', 'Course marketplace'] },
    { title: 'Services marketplace', description: 'Booking, payments, and reviews for service providers.', examples: ['Coaches directory', 'Tutors platform', 'Home services'] },
  ],
  'community': [
    { priority: 'high', title: 'Private paid community', description: 'Members, channels, events, and gated content with billing.', examples: ['Founders community', 'Creator Patreon-style', 'Alumni network'] },
    { priority: 'medium', title: 'Customer community forum', description: 'Product Q&A, feature requests, and a public roadmap.', examples: ['Support forum', 'Roadmap voting', 'Power-user circle'] },
    { title: 'Events + meetups hub', description: 'Organize recurring events with RSVPs, speakers, and recaps.', examples: ['Meetup chapter', 'Internal speakers series', 'Virtual summit'] },
  ],
}

// ---------------------------------------------------------------------------
// Reviews — deterministic mock reviews seeded by template id
// ---------------------------------------------------------------------------

interface TemplateReview {
  id: string
  reviewer: string
  role: string
  avatar: string
  rating: number
  title: string
  text: string
  date: string
  helpful: number
  verified: boolean
}

const REVIEWER_POOL: Array<{ name: string; role: string; avatar: string }> = [
  { name: 'Ava Patel',       role: 'Founder · Seed-stage SaaS',    avatar: 'AP' },
  { name: 'Marcus Lee',      role: 'Staff Engineer · Fintech',     avatar: 'ML' },
  { name: 'Priya Singh',     role: 'Head of Product · Series B',   avatar: 'PS' },
  { name: 'Jordan Rivera',   role: 'Indie Hacker',                 avatar: 'JR' },
  { name: 'Samuel Okafor',   role: 'Engineering Manager',          avatar: 'SO' },
  { name: 'Elena Rodríguez', role: 'Design Lead',                  avatar: 'ER' },
  { name: 'Kenji Tanaka',    role: 'Product Designer',             avatar: 'KT' },
  { name: 'Lina Haddad',     role: 'Solutions Architect',          avatar: 'LH' },
  { name: 'Nora Beckett',    role: 'CTO · Consumer App',           avatar: 'NB' },
  { name: 'Diego Fernández', role: 'Tech Lead · Enterprise',       avatar: 'DF' },
]

const REVIEW_TITLES = [
  'Shipped faster than expected',
  'Saved us weeks of setup',
  'Solid foundation — needed minor tweaks',
  'Great multi-studio coverage',
  'AI remix is the killer feature',
  'Worked end-to-end on first install',
  'Clean graph, easy to extend',
  'Exactly what our team needed',
]

const REVIEW_BODIES = [
  'The studio footprint is wider than any other template I have used — pages, workflows, entities, and even analytics dropped in wired up. Felt like a weekend of work compressed into an hour.',
  'AI remix let me swap the brand, change a role name, and regenerate half the pages without touching code. Huge time saver for our team.',
  'Installed as draft and our engineers got to commit almost immediately. Graph was clean, entities were named sensibly, and the connectors worked first try.',
  'Not perfect — a couple of workflows needed customization for our compliance flow — but the bones were all there. Fastest "from zero to demo" I have seen.',
  'Our designer loved that tokens and components shipped wired to the brand builder. Meant the rebrand pass was literally a five-minute job.',
  'Would recommend for anyone spinning up a new product. The multi-studio install is genuinely what makes Product OS feel different from boilerplate repos.',
  'Took a bit of tuning to match our stack choices, but the remix prompts made it painless. Rating is a clear 5/5 for first-drafts, 4/5 for "ready to ship."',
  'Events and analytics wiring out of the box was the part I underestimated. Usually the last mile — shipped in the first install here.',
]

// Deterministic seeded PRNG, keyed by string id. Used for mock data that
// needs to be stable across renders (reviews, spec samples).
function makeSeededRand(id: string): () => number {
  let seed = 0
  for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Pools sampled by SpecificationsTab — hoisted so they aren't reallocated per render.
const CONNECTOR_POOL = ['Stripe', 'Postgres', 'Resend', 'Slack', 'Segment', 'GitHub', 'Linear', 'HubSpot', 'Supabase', 'ClickHouse', 'OpenAI', 'Anthropic']
const EVENT_POOL = ['user.signed_up', 'workspace.created', 'plan.upgraded', 'invite.sent', 'page.viewed', 'entity.updated', 'workflow.triggered', 'feature.used', 'billing.charged', 'session.started']

function generateReviews(template: MarketplaceTemplate): TemplateReview[] {
  const rand = makeSeededRand(template.id)
  const count = 3 + Math.floor(rand() * 3)
  const used = new Set<number>()
  const out: TemplateReview[] = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(rand() * REVIEWER_POOL.length)
    while (used.has(idx)) idx = (idx + 1) % REVIEWER_POOL.length
    used.add(idx)
    const reviewer = REVIEWER_POOL[idx]!
    const jitter = (rand() - 0.5) * 1.2
    const rating = Math.min(5, Math.max(3, Math.round((template.rating + jitter) * 2) / 2))
    const daysAgo = Math.floor(rand() * 120) + 2
    const date = new Date(now - daysAgo * 86_400_000).toISOString()
    const title = REVIEW_TITLES[Math.floor(rand() * REVIEW_TITLES.length)]!
    const text = REVIEW_BODIES[Math.floor(rand() * REVIEW_BODIES.length)]!
    out.push({
      id: `${template.id}-review-${i}`,
      reviewer: reviewer.name,
      role: reviewer.role,
      avatar: reviewer.avatar,
      rating,
      title,
      text,
      date,
      helpful: Math.floor(rand() * 48) + 1,
      verified: rand() > 0.35,
    })
  }
  return out
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86_400_000)
  if (d < 1) return 'today'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}


function shuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function makeTemplates(): MarketplaceTemplate[] {
  const authors = [
    'Product OS Team',
    'Indie Maker',
    'Ops Lab',
    'Growth Studio',
    'AI Collective',
    'Workflow Pro',
    'Data Viz Guild',
    'Dev Toolsmiths',
    'Commerce Co',
  ]
  const out: MarketplaceTemplate[] = []
  let seed = 1337
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  for (const spec of CATEGORY_SPECS) {
    spec.ideas.forEach((idea, idx) => {
      const id = `app-${spec.category}-${slug(idea.name)}`
      const tagCount = 3 + Math.floor(rand() * 2)
      const tags = shuffle(spec.tagPool, rand).slice(0, tagCount)
      const nodeCount = 12 + Math.floor(rand() * 60)
      const edgeCount = Math.floor(nodeCount * (0.8 + rand() * 0.7))
      const complexity: Complexity =
        nodeCount < 25 ? 'starter' : nodeCount < 50 ? 'pro' : 'enterprise'
      const studios = deriveStudios(spec.category, complexity)
      const ships = deriveShips(spec.category, complexity, nodeCount, rand)
      const aiRemix = CATEGORY_REMIX[spec.category] ?? ['Use our brand tokens', 'Rename entities', 'Add another role']
      out.push({
        id,
        name: idea.name,
        tagline: idea.tagline,
        description: `${idea.name} — a multi-studio blueprint that deploys across ${studios.length} studios. Installs as a draft product with a shared graph, brand tokens, workflows, and AI skills already wired together.`,
        category: spec.category,
        author: authors[Math.floor(rand() * authors.length)] ?? 'Product OS Team',
        downloads: 150 + Math.floor(rand() * 6000),
        rating: Math.round((4.1 + rand() * 0.9) * 10) / 10,
        tags,
        preview: `${nodeCount} nodes · ${edgeCount} edges`,
        nodeCount,
        edgeCount,
        responsive: true,
        breakpoints: ALL_BREAKPOINTS,
        complexity,
        stack: spec.stack,
        icon: idea.icon,
        gradient: spec.gradient,
        featured: idx === 0,
        isNew: idx === 1,
        trending: idx === 2 && rand() > 0.4,
        studios,
        ships,
        aiRemix,
      })
    })
  }

  return out
}

const marketplaceTemplates: MarketplaceTemplate[] = makeTemplates()

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const categoryMeta: Record<AppCategory, { label: string; icon: React.ReactNode; blurb: string }> = {
  'saas-app':      { label: 'SaaS Apps',       icon: <Boxes className="w-3.5 h-3.5" />,         blurb: 'Multi-tenant products with auth, billing, and workspaces' },
  'internal-tool': { label: 'Internal Tools',  icon: <Briefcase className="w-3.5 h-3.5" />,     blurb: 'Ops, approvals, inventory and back-office workflows' },
  'admin-panel':   { label: 'Admin Panels',    icon: <Shield className="w-3.5 h-3.5" />,        blurb: 'User management, RBAC, audits, and feature flags' },
  'dashboard':     { label: 'Dashboards',      icon: <BarChart3 className="w-3.5 h-3.5" />,     blurb: 'KPI, analytics, and real-time operational views' },
  'crm':           { label: 'CRM & Sales',     icon: <Users className="w-3.5 h-3.5" />,         blurb: 'Contacts, pipelines, cadences, and revenue ops' },
  'pm-tool':       { label: 'Project Mgmt',    icon: <FolderKanban className="w-3.5 h-3.5" />,  blurb: 'Issues, sprints, roadmaps, and OKRs' },
  'ai-app':        { label: 'AI Apps',         icon: <Bot className="w-3.5 h-3.5" />,           blurb: 'Chat, RAG, agents, copilots, and prompt studios' },
  'collab':        { label: 'Collaboration',   icon: <MessageSquare className="w-3.5 h-3.5" />, blurb: 'Realtime docs, boards, chat, and shared inboxes' },
  'data-app':      { label: 'Data Apps',       icon: <Database className="w-3.5 h-3.5" />,      blurb: 'Query, catalog, lineage, quality, and spreadsheets' },
  'dev-tool':      { label: 'Developer Tools', icon: <Code2 className="w-3.5 h-3.5" />,         blurb: 'APIs, deploys, logs, flags, and webhooks' },
  'finance':       { label: 'Finance & Billing', icon: <Wallet className="w-3.5 h-3.5" />,      blurb: 'Subscriptions, invoices, payroll, and budgets' },
  'hr-app':        { label: 'People & HR',     icon: <Users className="w-3.5 h-3.5" />,         blurb: 'ATS, onboarding, reviews, comp, and PTO' },
  'support':       { label: 'Support',         icon: <Headphones className="w-3.5 h-3.5" />,    blurb: 'Helpdesk, chat, help centers, feedback, and status' },
  'edu-app':       { label: 'Education',       icon: <GraduationCap className="w-3.5 h-3.5" />, blurb: 'LMS, cohorts, quizzes, certifications, flashcards' },
  'ecom-ops':      { label: 'Commerce Ops',    icon: <ShoppingBag className="w-3.5 h-3.5" />,   blurb: 'Orders, fulfillment, returns, and catalogs' },
  'marketplace':   { label: 'Marketplaces',    icon: <Store className="w-3.5 h-3.5" />,         blurb: 'Two-sided, services, talent, and rentals' },
  'community':     { label: 'Community',       icon: <Users className="w-3.5 h-3.5" />,         blurb: 'Forums, member hubs, events, Q&A, and programs' },
}

const COMPLEXITY_META: Record<Complexity, { label: string; color: string }> = {
  starter:    { label: 'Starter',    color: '#10B981' },
  pro:        { label: 'Pro',        color: '#3B82F6' },
  enterprise: { label: 'Enterprise', color: '#F59E0B' },
}

// Studio metadata — icon + label + accent used across badges, footprint grids, and tooltips.
const STUDIO_META: Record<StudioKey, { label: string; icon: React.ReactNode; color: string; hint: string }> = {
  planner:    { label: 'Planner',    icon: <Compass className="w-3 h-3" />,    color: '#60A5FA', hint: '7-step plan, goals, roles' },
  canvas:     { label: 'Canvas',     icon: <Layers className="w-3 h-3" />,     color: '#A78BFA', hint: 'Sitemap, IA, journeys' },
  brand:      { label: 'Brand',      icon: <Palette className="w-3 h-3" />,    color: '#F472B6', hint: 'Tokens, themes, typography' },
  components: { label: 'Components', icon: <Component className="w-3 h-3" />,  color: '#22D3EE', hint: 'Reusable UI primitives' },
  design:     { label: 'Design',     icon: <Sparkles className="w-3 h-3" />,   color: '#C084FC', hint: 'Screens, prototypes, specs' },
  workflow:   { label: 'Workflow',   icon: <WorkflowIcon className="w-3 h-3" />,color: '#34D399', hint: 'Entities, states, automations' },
  pages:      { label: 'Pages',      icon: <FileText className="w-3 h-3" />,   color: '#FBBF24', hint: 'Page tree + sections' },
  code:       { label: 'Code',       icon: <Code2 className="w-3 h-3" />,      color: '#94A3B8', hint: 'Scaffold + generated files' },
  graphics:   { label: 'Graphics',   icon: <ImageIcon className="w-3 h-3" />,  color: '#F59E0B', hint: 'Campaign + brand assets' },
  analytics:  { label: 'Analytics',  icon: <Activity className="w-3 h-3" />,   color: '#10B981', hint: 'Events, funnels, KPIs' },
  handoff:    { label: 'Handoff',    icon: <Network className="w-3 h-3" />,    color: '#6366F1', hint: 'Inspect, specs, acceptance' },
  test:       { label: 'Test',       icon: <Shield className="w-3 h-3" />,     color: '#F87171', hint: 'Role sims, a11y, drift' },
  skills:     { label: 'AI Skills',  icon: <Wand2 className="w-3 h-3" />,      color: '#D946EF', hint: 'Graph-aware AI actions' },
  connectors: { label: 'Connectors', icon: <Plug className="w-3 h-3" />,       color: '#0EA5E9', hint: 'External system bindings' },
}

// Short-form "what ships" metadata for the artifact grid.
interface ShipsMetaItem {
  key: keyof BlueprintShips
  label: string
  icon: React.ReactNode
  color: string
}
const SHIPS_META: ShipsMetaItem[] = [
  { key: 'pages',      label: 'Pages',      icon: <FileText className="w-3.5 h-3.5" />,    color: '#FBBF24' },
  { key: 'entities',   label: 'Entities',   icon: <Database className="w-3.5 h-3.5" />,    color: '#22D3EE' },
  { key: 'workflows',  label: 'Workflows',  icon: <WorkflowIcon className="w-3.5 h-3.5" />,color: '#34D399' },
  { key: 'components', label: 'Components', icon: <Component className="w-3.5 h-3.5" />,   color: '#A78BFA' },
  { key: 'tokens',     label: 'Brand tokens',icon: <Palette className="w-3.5 h-3.5" />,    color: '#F472B6' },
  { key: 'skills',     label: 'AI skills',  icon: <Wand2 className="w-3.5 h-3.5" />,       color: '#D946EF' },
  { key: 'connectors', label: 'Connectors', icon: <Plug className="w-3.5 h-3.5" />,        color: '#0EA5E9' },
  { key: 'events',     label: 'Analytics events', icon: <Activity className="w-3.5 h-3.5" />, color: '#10B981' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TemplateMarketplaceProps {
  open: boolean
  onClose: () => void
  onInstall?: (template: MarketplaceTemplate) => void
}

type ViewMode = 'browse' | 'immersive'

export function TemplateMarketplace({ open, onClose, onInstall }: TemplateMarketplaceProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<AppCategory | 'all'>('all')
  const [activeComplexity, setActiveComplexity] = useState<Complexity | 'all'>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('browse')

  const filtered = useMemo(() => {
    let items = marketplaceTemplates
    if (activeCategory !== 'all') items = items.filter((t) => t.category === activeCategory)
    if (activeComplexity !== 'all') items = items.filter((t) => t.complexity === activeComplexity)
    if (activeTag) items = items.filter((t) => t.tags.includes(activeTag))
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.tagline.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q)),
      )
    }
    return items
  }, [search, activeCategory, activeComplexity, activeTag])

  const featured = useMemo(
    () => marketplaceTemplates.filter((t) => t.featured).slice(0, 4),
    [],
  )
  const trending = useMemo(
    () => marketplaceTemplates.filter((t) => t.trending).slice(0, 6),
    [],
  )
  const newArrivals = useMemo(
    () => marketplaceTemplates.filter((t) => t.isNew).slice(0, 6),
    [],
  )

  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {}
    marketplaceTemplates.forEach((t) => t.tags.forEach((tag) => (counts[tag] = (counts[tag] ?? 0) + 1)))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t)
  }, [])

  const handleInstall = useCallback(
    (template: MarketplaceTemplate) => {
      setInstallingId(template.id)
      setTimeout(() => {
        setInstalledIds((prev) => new Set([...prev, template.id]))
        setInstallingId(null)
        onInstall?.(template)
      }, 1200)
    },
    [onInstall],
  )

  const previewTemplate = previewId ? marketplaceTemplates.find((t) => t.id === previewId) : null
  const moreFromAuthor = previewTemplate
    ? marketplaceTemplates.filter((t) => t.author === previewTemplate.author && t.id !== previewTemplate.id).slice(0, 3)
    : []

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewId) setPreviewId(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, previewId, onClose])

  const resetFilters = () => {
    setSearch('')
    setActiveCategory('all')
    setActiveComplexity('all')
    setActiveTag(null)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        key="mp-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-[var(--bg-base)]/95 backdrop-blur-xl overflow-hidden"
      >
        {/* Ambient gradient accents */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(circle at 15% 0%, rgba(139,92,246,0.10), transparent 55%), radial-gradient(circle at 85% 100%, rgba(59,130,246,0.08), transparent 55%)',
          }}
        />

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative h-full flex flex-col"
        >
          {/* Top bar */}
          <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 flex items-center justify-center">
                <Store className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-medium text-[var(--text-primary)]">Blueprint Marketplace</h1>
                  <span className="text-[10px] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                    {marketplaceTemplates.length} web-app blueprints
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Multi-studio bundles — each blueprint deploys graph + design + workflows + skills in one install.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <button
                  onClick={() => setViewMode('browse')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition ${
                    viewMode === 'browse'
                      ? 'bg-white/[0.08] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                  title="Browse with filters"
                >
                  <List className="w-3 h-3" />
                  Browse
                </button>
                <button
                  onClick={() => setViewMode('immersive')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition ${
                    viewMode === 'immersive'
                      ? 'bg-white/[0.08] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                  title="Full-screen overview"
                >
                  <Expand className="w-3 h-3" />
                  Immersive
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center transition"
                aria-label="Close marketplace"
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>

          {/* Search row */}
          <div className="shrink-0 px-6 py-3 border-b border-white/[0.06] flex items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 100+ blueprints — e.g. “AI chat”, “approval”, “LMS”..."
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg bg-white/[0.03] border border-white/[0.08] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-white/[0.05] transition"
              />
            </div>

            {(activeCategory !== 'all' || activeComplexity !== 'all' || activeTag || search) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
            <div className="ml-auto text-[11px] text-[var(--text-tertiary)]">
              {filtered.length} of {marketplaceTemplates.length}
            </div>
          </div>

          {/* Category pill scroller */}
          <div className="shrink-0 px-6 py-3 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition ${
                  activeCategory === 'all'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                    : 'bg-white/[0.03] text-[var(--text-secondary)] border border-white/[0.06] hover:border-white/[0.12] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles className="w-3 h-3" /> All apps
              </button>
              {(Object.keys(categoryMeta) as AppCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition ${
                    activeCategory === cat
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                      : 'bg-white/[0.03] text-[var(--text-secondary)] border border-white/[0.06] hover:border-white/[0.12] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {categoryMeta[cat].icon}
                  {categoryMeta[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'immersive' ? (
              <ImmersiveView
                items={filtered}
                onPreview={(id) => setPreviewId(id)}
                onInstall={handleInstall}
                installedIds={installedIds}
                installingId={installingId}
              />
            ) : (
              <BrowseView
                items={filtered}
                search={search}
                featured={featured}
                trending={trending}
                newArrivals={newArrivals}
                activeCategory={activeCategory}
                activeTag={activeTag}
                popularTags={popularTags}
                activeComplexity={activeComplexity}
                onSetComplexity={setActiveComplexity}
                onSetTag={(t) => setActiveTag((prev) => (prev === t ? null : t))}
                onPreview={(id) => setPreviewId(id)}
                onInstall={handleInstall}
                installedIds={installedIds}
                installingId={installingId}
              />
            )}
          </div>

          {/* Detail drawer */}
          <AnimatePresence>
            {previewTemplate && (
              <DetailDrawer
                key={previewTemplate.id}
                template={previewTemplate}
                moreFromAuthor={moreFromAuthor}
                installed={installedIds.has(previewTemplate.id)}
                installing={installingId === previewTemplate.id}
                onInstall={() => handleInstall(previewTemplate)}
                onClose={() => setPreviewId(null)}
                onPickOther={(id) => setPreviewId(id)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Browse view (sidebar + hero + grid)
// ---------------------------------------------------------------------------

interface BrowseViewProps {
  items: MarketplaceTemplate[]
  search: string
  featured: MarketplaceTemplate[]
  trending: MarketplaceTemplate[]
  newArrivals: MarketplaceTemplate[]
  activeCategory: AppCategory | 'all'
  activeComplexity: Complexity | 'all'
  activeTag: string | null
  popularTags: string[]
  onSetComplexity: (c: Complexity | 'all') => void
  onSetTag: (t: string) => void
  onPreview: (id: string) => void
  onInstall: (tpl: MarketplaceTemplate) => void
  installedIds: Set<string>
  installingId: string | null
}

function BrowseView({
  items,
  search,
  featured,
  trending,
  newArrivals,
  activeCategory,
  activeComplexity,
  activeTag,
  popularTags,
  onSetComplexity,
  onSetTag,
  onPreview,
  onInstall,
  installedIds,
  installingId,
}: BrowseViewProps) {
  const showHero = activeCategory === 'all' && !search && !activeTag && activeComplexity === 'all'

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar — Browse By */}
      <aside className="w-56 shrink-0 border-r border-white/[0.06] overflow-y-auto px-4 py-5 space-y-5">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Filter className="w-3 h-3 text-[var(--text-tertiary)]" />
            <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Browse By</p>
          </div>
        </div>

        <SidebarSection title="Complexity">
          {(['all', 'starter', 'pro', 'enterprise'] as const).map((c) => (
            <button
              key={c}
              onClick={() => onSetComplexity(c)}
              className={`w-full flex items-center justify-between text-[12px] py-1.5 px-2 rounded-md transition ${
                activeComplexity === c
                  ? 'bg-white/[0.06] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]'
              }`}
            >
              <span>{c === 'all' ? 'All levels' : COMPLEXITY_META[c as Complexity].label}</span>
              {c !== 'all' && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: COMPLEXITY_META[c as Complexity].color }}
                />
              )}
            </button>
          ))}
        </SidebarSection>

        <SidebarSection title="Popular tags">
          <div className="flex flex-wrap gap-1">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSetTag(tag)}
                className={`text-[10px] px-2 py-1 rounded-full border transition ${
                  activeTag === tag
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30'
                    : 'bg-white/[0.02] text-[var(--text-secondary)] border-white/[0.06] hover:border-white/[0.15]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection title="Every blueprint ships">
          <ul className="space-y-1.5 text-[11px] text-[var(--text-tertiary)]">
            <li className="flex items-center gap-1.5"><CircuitBoard className="w-3 h-3" /> Multi-studio footprint</li>
            <li className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Shared product graph</li>
            <li className="flex items-center gap-1.5"><Palette className="w-3 h-3" /> Brand tokens + themes</li>
            <li className="flex items-center gap-1.5"><WorkflowIcon className="w-3 h-3" /> Workflows + entities</li>
            <li className="flex items-center gap-1.5"><Wand2 className="w-3 h-3" /> AI skills pre-wired</li>
            <li className="flex items-center gap-1.5"><Plug className="w-3 h-3" /> Connector bindings</li>
            <li className="flex items-center gap-1.5"><Gauge className="w-3 h-3" /> Responsive across 4 breakpoints</li>
            <li className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Installs as a draft product</li>
          </ul>
        </SidebarSection>
      </aside>

      {/* Main grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {showHero && featured.length > 0 && <HeroSection featured={featured} onPreview={onPreview} />}

        {showHero && trending.length > 0 && (
          <Section title="Trending this week" icon={<Flame className="w-3.5 h-3.5 text-[var(--color-warning)]" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {trending.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onPreview={() => onPreview(tpl.id)}
                  onInstall={() => onInstall(tpl)}
                  installed={installedIds.has(tpl.id)}
                  installing={installingId === tpl.id}
                />
              ))}
            </div>
          </Section>
        )}

        {showHero && newArrivals.length > 0 && (
          <Section title="New arrivals" icon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {newArrivals.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onPreview={() => onPreview(tpl.id)}
                  onInstall={() => onInstall(tpl)}
                  installed={installedIds.has(tpl.id)}
                  installing={installingId === tpl.id}
                />
              ))}
            </div>
          </Section>
        )}

        <Section
          title={
            activeCategory === 'all' ? 'All web app ideas' : `${categoryMeta[activeCategory as AppCategory].label} ideas`
          }
          subtitle={activeCategory !== 'all' ? categoryMeta[activeCategory as AppCategory].blurb : undefined}
        >
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onPreview={() => onPreview(tpl.id)}
                  onInstall={() => onInstall(tpl)}
                  installed={installedIds.has(tpl.id)}
                  installing={installingId === tpl.id}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Immersive view — large-canvas overview of every template
// ---------------------------------------------------------------------------

interface ImmersiveViewProps {
  items: MarketplaceTemplate[]
  onPreview: (id: string) => void
  onInstall: (tpl: MarketplaceTemplate) => void
  installedIds: Set<string>
  installingId: string | null
}

function ImmersiveView({ items, onPreview, onInstall, installedIds, installingId }: ImmersiveViewProps) {
  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-[var(--accent)]" />
            Every blueprint at a glance
          </h2>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            Full-screen overview of {items.length} multi-studio bundles. Click any tile to explore its studio footprint.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
        {items.map((tpl, i) => (
          <motion.button
            key={tpl.id}
            onClick={() => onPreview(tpl.id)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.01, 0.25) }}
            className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.18] transition-all text-left"
            style={{ background: `linear-gradient(135deg, ${tpl.gradient[0]}22, ${tpl.gradient[1]}14)` }}
          >
            {/* Animated scene */}
            <div className="absolute inset-0 opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500">
              <BlueprintIllustration category={tpl.category} gradient={tpl.gradient} size="sm" reduceMotion={i > 24} />
            </div>

            {/* Info footer */}
            <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <p className="text-[11px] font-medium text-white truncate">{tpl.name}</p>
              <p className="text-[9px] text-white/60 mt-0.5 truncate">{tpl.tagline}</p>
              <div className="flex items-center gap-0.5 mt-1">
                {tpl.studios.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="w-3.5 h-3.5 rounded-sm flex items-center justify-center"
                    style={{ backgroundColor: `${STUDIO_META[s].color}40`, color: STUDIO_META[s].color }}
                    title={STUDIO_META[s].label}
                  >
                    {STUDIO_META[s].icon}
                  </span>
                ))}
                {tpl.studios.length > 5 && (
                  <span className="text-[8px] text-white/60 ml-0.5">+{tpl.studios.length - 5}</span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              {tpl.featured && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/80 text-white">Featured</span>
              )}
              {tpl.isNew && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-success)]/80 text-white">New</span>
              )}
              {tpl.trending && !tpl.featured && !tpl.isNew && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-warning)]/80 text-white">Trending</span>
              )}
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <div
                className="w-6 h-6 rounded-md bg-black/50 backdrop-blur flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  if (installedIds.has(tpl.id) || installingId === tpl.id) return
                  onInstall(tpl)
                }}
              >
                {installedIds.has(tpl.id) ? (
                  <Check className="w-3 h-3 text-white" />
                ) : installingId === tpl.id ? (
                  <RefreshCw className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <Download className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail drawer
// ---------------------------------------------------------------------------

interface DetailDrawerProps {
  template: MarketplaceTemplate
  moreFromAuthor: MarketplaceTemplate[]
  installed: boolean
  installing: boolean
  onInstall: () => void
  onClose: () => void
  onPickOther: (id: string) => void
}

function DetailDrawer({
  template,
  moreFromAuthor,
  installed,
  installing,
  onInstall,
  onClose,
  onPickOther,
}: DetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications'>('overview')
  const useCases = CATEGORY_USE_CASES[template.category] ?? []
  const reviews = useMemo(() => generateReviews(template), [template.id, template.rating])
  const reviewAvg = useMemo(
    () => (reviews.reduce((a, r) => a + r.rating, 0) / Math.max(1, reviews.length)),
    [reviews]
  )
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]
    for (const r of reviews) {
      const idx = Math.max(0, Math.min(4, Math.round(r.rating) - 1))
      dist[idx]! += 1
    }
    return dist
  }, [reviews])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-stretch justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 32, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-full bg-[var(--bg-base)] border-l border-white/[0.08] shadow-2xl overflow-y-auto"
      >
        {/* Animated hero scene */}
        <div
          className="relative h-56 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${template.gradient[0]}55, ${template.gradient[1]}22)` }}
        >
          <div className="absolute inset-0">
            <BlueprintIllustration category={template.category} gradient={template.gradient} size="lg" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/30 backdrop-blur hover:bg-black/50 flex items-center justify-center transition"
            aria-label="Close detail"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-1 rounded-full bg-black/40 backdrop-blur text-white/90 flex items-center gap-1">
              {categoryMeta[template.category].icon}
              {categoryMeta[template.category].label}
            </span>
            <span
              className="text-[10px] px-2 py-1 rounded-full text-white/90 backdrop-blur"
              style={{ backgroundColor: `${COMPLEXITY_META[template.complexity].color}40` }}
            >
              {COMPLEXITY_META[template.complexity].label}
            </span>
          </div>
        </div>

        {/* Title block */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <h2 className="text-xl font-medium text-[var(--text-primary)]">{template.name}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{template.tagline}</p>

          <div className="flex items-center gap-4 mt-3 text-[11px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-[var(--color-warning)]" />{template.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />{template.downloads.toLocaleString()}
            </span>
            <span>{template.preview}</span>
            <span>by <span className="text-[var(--text-secondary)]">{template.author}</span></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-4">
            {installed ? (
              <>
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-success)]/15 text-[var(--color-success)] text-[13px] font-medium"
                >
                  <Check className="w-3.5 h-3.5" /> Installed as draft
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-[13px] font-medium transition">
                  <Rocket className="w-3.5 h-3.5" /> Open in Control Tower
                </button>
              </>
            ) : (
              <button
                onClick={onInstall}
                disabled={installing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-[13px] font-medium disabled:opacity-60 transition"
              >
                {installing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="flex flex-col items-start leading-tight">
                  <span>{installing ? 'Installing blueprint…' : 'Install blueprint as draft'}</span>
                  <span className="text-[9px] font-normal opacity-80">
                    Deploys across {template.studios.length} studios · {template.ships.pages} pages · {template.ships.entities} entities
                  </span>
                </span>
              </button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-[13px] text-[var(--text-secondary)] transition">
              <Eye className="w-3.5 h-3.5" /> Preview in graph
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="sticky top-0 z-10 bg-[var(--bg-base)] px-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-1">
            {([
              { id: 'overview', label: 'Overview', icon: <Info className="w-3.5 h-3.5" /> },
              { id: 'specifications', label: 'Specifications', icon: <Cpu className="w-3.5 h-3.5" /> },
            ] as const).map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium transition"
                  style={{
                    color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="detail-drawer-tab"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{template.description}</p>

              {/* Use Cases — what real apps you can build from this template */}
              {useCases.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" /> Use cases
                    </p>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {useCases.length} ways to use this
                    </span>
                  </div>
                  <div className="space-y-2">
                    {useCases.map((uc, i) => {
                      const isHigh = uc.priority === 'high'
                      return (
                        <div
                          key={uc.title}
                          className="relative rounded-xl border p-4 transition"
                          style={{
                            borderColor: isHigh
                              ? `${template.gradient[0]}55`
                              : 'rgba(255,255,255,0.06)',
                            background: isHigh
                              ? `linear-gradient(135deg, ${template.gradient[0]}14, ${template.gradient[1]}08)`
                              : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold tabular-nums"
                              style={{
                                backgroundColor: isHigh
                                  ? `${template.gradient[0]}33`
                                  : 'rgba(255,255,255,0.04)',
                                color: isHigh ? template.gradient[0] : 'var(--text-tertiary)',
                              }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">
                                  {uc.title}
                                </h4>
                                {isHigh && (
                                  <span
                                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full tracking-wider uppercase"
                                    style={{
                                      backgroundColor: `${template.gradient[0]}22`,
                                      color: template.gradient[0],
                                    }}
                                  >
                                    <Flame className="w-2.5 h-2.5 inline mr-0.5" />
                                    Best fit
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-2">
                                {uc.description}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {uc.examples.map((ex) => (
                                  <span
                                    key={ex}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[var(--text-secondary)]"
                                  >
                                    {ex}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Studio Footprint — the core "multi-studio bundle" concept */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                    <CircuitBoard className="w-3 h-3" /> Studio footprint
                  </p>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {template.studios.length} of 14 studios light up
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {(Object.keys(STUDIO_META) as StudioKey[]).map((s) => {
                    const active = template.studios.includes(s)
                    return (
                      <div
                        key={s}
                        title={STUDIO_META[s].hint}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border"
                        style={{
                          backgroundColor: active ? `${STUDIO_META[s].color}14` : 'rgba(255,255,255,0.02)',
                          borderColor: active ? `${STUDIO_META[s].color}33` : 'rgba(255,255,255,0.06)',
                          color: active ? STUDIO_META[s].color : 'var(--text-tertiary)',
                          opacity: active ? 1 : 0.4,
                        }}
                      >
                        {STUDIO_META[s].icon}
                        <span className="text-[10px] font-medium truncate">{STUDIO_META[s].label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* What Ships — concrete artifacts deployed to the product graph */}
              <div>
                <SpecSectionHeader icon={<Boxes className="w-3 h-3" />} label="What ships" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SHIPS_META.filter((m) => (template.ships[m.key] as number) > 0).map((m) => (
                    <div
                      key={m.key}
                      className="px-2.5 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-1.5" style={{ color: m.color }}>
                        {m.icon}
                        <span className="text-base font-semibold tabular-nums">
                          {template.ships[m.key] as number}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Remix — natural-language customization hooks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 className="w-3 h-3" /> AI remix
                  </p>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    Tweak before install
                  </span>
                </div>
                <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {template.aiRemix.map((prompt) => (
                      <button
                        key={prompt}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition"
                      >
                        + {prompt}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Describe a change — e.g. “Make it dark-mode first with a green accent”"
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40"
                    />
                    <button className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25 transition">
                      <Sparkles className="w-3 h-3" /> Remix
                    </button>
                  </div>
                </div>
              </div>

              {/* Reviews — community feedback */}
              <ReviewsSection reviews={reviews} reviewAvg={reviewAvg} ratingDist={ratingDist} />

              {moreFromAuthor.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                      More from {template.author}
                    </p>
                    <button className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-0.5">
                      See all <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {moreFromAuthor.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onPickOther(t.id)}
                        className="group relative aspect-video rounded-lg overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition text-left"
                        style={{ background: `linear-gradient(135deg, ${t.gradient[0]}25, ${t.gradient[1]}12)` }}
                      >
                        <div className="absolute inset-0">
                          <BlueprintIllustration category={t.category} gradient={t.gradient} size="sm" reduceMotion />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-[10px] font-medium text-white truncate">{t.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'specifications' && (
            <SpecificationsTab template={template} />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Reviews section — renders distribution + individual reviews + write form
// ---------------------------------------------------------------------------

function ReviewsSection({
  reviews,
  reviewAvg,
  ratingDist,
}: {
  reviews: TemplateReview[]
  reviewAvg: number
  ratingDist: number[]
}) {
  const [writing, setWriting] = useState(false)
  const [draftRating, setDraftRating] = useState(5)
  const [draftText, setDraftText] = useState('')
  const totalReviews = reviews.length
  const maxBar = Math.max(1, ...ratingDist)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" /> Reviews
        </p>
        <button
          onClick={() => setWriting((v) => !v)}
          className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1"
        >
          <Send className="w-3 h-3" /> Write a review
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-center">
          <div className="text-center sm:text-left">
            <div className="text-3xl font-semibold text-[var(--text-primary)] tabular-nums leading-none">
              {reviewAvg.toFixed(1)}
            </div>
            <div className="mt-1 flex justify-center sm:justify-start">
              <StarRow value={reviewAvg} size="md" />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
              {totalReviews} review{totalReviews === 1 ? '' : 's'}
            </p>
          </div>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[star - 1] ?? 0
              const pct = Math.round((count / maxBar) * 100)
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-tertiary)] w-3 tabular-nums">{star}</span>
                  <Star className="w-2.5 h-2.5 text-[var(--color-warning)]" />
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-warning)] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums w-5 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Write a review */}
      <AnimatePresence initial={false}>
        {writing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[var(--text-secondary)]">Your rating</span>
                <StarRow value={draftRating} size="lg" onChange={setDraftRating} />
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {draftRating}.0
                </span>
              </div>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Share what worked, what needed tweaking, and who this template is best for…"
                rows={3}
                className="w-full text-[12px] px-2.5 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40 resize-none"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => { setWriting(false); setDraftText(''); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-md text-[var(--text-secondary)] hover:bg-white/[0.04] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setWriting(false); setDraftText(''); setDraftRating(5); }}
                  disabled={draftText.trim().length < 10}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Send className="w-3 h-3" /> Post review
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Individual reviews */}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 text-[var(--text-primary)] border border-white/[0.08]">
                {r.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                    {r.reviewer}
                  </span>
                  {r.verified && (
                    <span className="flex items-center gap-0.5 text-[9px] text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 px-1.5 py-0.5 rounded-full">
                      <Check className="w-2 h-2" /> Verified install
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)]">{r.role}</p>

                <div className="flex items-center gap-2 mt-1.5">
                  <StarRow value={r.rating} size="sm" />
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(r.date)}
                  </span>
                </div>

                <p className="text-[12px] font-medium text-[var(--text-primary)] mt-2">
                  {r.title}
                </p>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mt-1">
                  {r.text}
                </p>

                <div className="flex items-center gap-3 mt-2.5">
                  <button className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                    <ThumbsUp className="w-3 h-3" /> Helpful · {r.helpful}
                  </button>
                  <button className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Specifications tab — technical details: graph stats, stack, breakpoints, tags,
// requirements, entity schema preview, events, connectors.
// ---------------------------------------------------------------------------

const COMPLEXITY_HINT: Record<Complexity, string> = {
  starter: 'Lightweight scaffold. Ships with the core graph needed to demo the idea — extend freely.',
  pro: 'Production-ready. Full workflows, analytics events, and at least one paid-tier flow wired up.',
  enterprise: 'Scales across teams. Includes multi-tenant plumbing, audit trails, and compliance hooks.',
}

function SpecificationsTab({ template }: { template: MarketplaceTemplate }) {
  const { connectorNames, eventNames } = useMemo(() => {
    const rand = makeSeededRand(template.id)
    return {
      connectorNames: shuffle(CONNECTOR_POOL, rand).slice(0, template.ships.connectors),
      eventNames: shuffle(EVENT_POOL, rand).slice(0, Math.min(template.ships.events, 6)),
    }
  }, [template.id, template.ships.connectors, template.ships.events])
  const complexityHint = COMPLEXITY_HINT[template.complexity]

  return (
    <div className="space-y-6">
      {/* Graph stats */}
      <div>
        <SpecSectionHeader icon={<GitBranch className="w-3 h-3" />} label="Graph stats" />
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] text-[var(--text-tertiary)]">Nodes</p>
            <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums mt-0.5">
              {template.nodeCount}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] text-[var(--text-tertiary)]">Edges</p>
            <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums mt-0.5">
              {template.edgeCount}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] text-[var(--text-tertiary)]">Studios</p>
            <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums mt-0.5">
              {template.studios.length}
            </p>
          </div>
        </div>
      </div>

      {/* Complexity */}
      <div>
        <SpecSectionHeader icon={<Gauge className="w-3 h-3" />} label="Complexity tier" />
        <div
          className="rounded-xl border p-3"
          style={{
            borderColor: `${COMPLEXITY_META[template.complexity].color}33`,
            backgroundColor: `${COMPLEXITY_META[template.complexity].color}0D`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: `${COMPLEXITY_META[template.complexity].color}33`,
                color: COMPLEXITY_META[template.complexity].color,
              }}
            >
              {COMPLEXITY_META[template.complexity].label}
            </span>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            {complexityHint}
          </p>
        </div>
      </div>

      {/* Stack */}
      <div>
        <SpecSectionHeader icon={<Code2 className="w-3 h-3" />} label="Stack" />
        <div className="flex flex-wrap gap-1.5">
          {template.stack.map((s) => (
            <span key={s} className="text-[11px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[var(--text-secondary)]">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Responsive breakpoints */}
      <div>
        <SpecSectionHeader icon={<Smartphone className="w-3 h-3" />} label="Responsive breakpoints" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ALL_BREAKPOINTS.map((bp) => {
            const supported = template.breakpoints.includes(bp)
            const icon = bp === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Globe className="w-3 h-3" />
            return (
              <div
                key={bp}
                className="flex items-center gap-2 px-2.5 py-2 rounded-md border"
                style={{
                  borderColor: supported ? `${template.gradient[0]}33` : 'rgba(255,255,255,0.06)',
                  backgroundColor: supported ? `${template.gradient[0]}0D` : 'rgba(255,255,255,0.02)',
                  opacity: supported ? 1 : 0.45,
                }}
              >
                {icon}
                <span className="text-[11px] text-[var(--text-secondary)] capitalize">{bp}</span>
                {supported && <Check className="w-3 h-3 ml-auto text-[var(--color-success)]" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Required connectors */}
      {connectorNames.length > 0 && (
        <div>
          <SpecSectionHeader icon={<Plug className="w-3 h-3" />} label="Required connectors" />
          <div className="flex flex-wrap gap-1.5">
            {connectorNames.map((c) => (
              <span
                key={c}
                className="text-[11px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[var(--text-secondary)] flex items-center gap-1"
              >
                <Plug className="w-3 h-3 text-[var(--accent)]" />
                {c}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
            Installer will prompt for credentials for each connector after install.
          </p>
        </div>
      )}

      {/* Events emitted */}
      {eventNames.length > 0 && (
        <div>
          <SpecSectionHeader icon={<Activity className="w-3 h-3" />} label="Analytics events emitted" />
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
            {eventNames.map((ev) => (
              <div
                key={ev}
                className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--color-success)]" />
                {ev}
              </div>
            ))}
            {template.ships.events > eventNames.length && (
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                + {template.ships.events - eventNames.length} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <SpecSectionHeader icon={<Filter className="w-3 h-3" />} label="Tags" />
        <div className="flex flex-wrap gap-1.5">
          {template.tags.map((t) => (
            <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Compatibility / requirements */}
      <div>
        <SpecSectionHeader icon={<Shield className="w-3 h-3" />} label="Requirements" />
        <ul className="space-y-1.5 text-[12px] text-[var(--text-secondary)]">
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
            Product OS workspace with Admin role
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
            At least one Brand profile (tokens can be remixed on install)
          </li>
          {template.ships.connectors > 0 && (
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              Credentials for {template.ships.connectors} connector{template.ships.connectors === 1 ? '' : 's'}
            </li>
          )}
          {template.ships.skills > 0 && (
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              AI Skills enabled on your plan ({template.ships.skills} skill{template.ships.skills === 1 ? '' : 's'} included)
            </li>
          )}
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
            Product remains a Draft until you publish from Control Tower
          </li>
        </ul>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function SpecSectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
      {icon} {label}
    </p>
  )
}

const STAR_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

function StarRow({
  value,
  size = 'md',
  onChange,
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
  onChange?: (n: number) => void
}) {
  const interactive = !!onChange
  const rounded = Math.round(value)
  return (
    <div className={`flex items-center ${interactive ? 'gap-0.5' : 'gap-0.5'}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rounded
        const star = (
          <Star
            className={`${STAR_SIZE[size]}${interactive ? ' transition' : ''}`}
            style={{
              fill: filled ? 'var(--color-warning)' : 'transparent',
              color: filled ? 'var(--color-warning)' : 'var(--text-tertiary)',
            }}
          />
        )
        return interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-medium text-[var(--text-primary)]">{title}</h2>
        {subtitle && <span className="text-[11px] text-[var(--text-tertiary)]">· {subtitle}</span>}
      </div>
      {children}
    </section>
  )
}

function HeroSection({ featured, onPreview }: { featured: MarketplaceTemplate[]; onPreview: (id: string) => void }) {
  if (featured.length === 0) return null
  const [lead, ...rest] = featured
  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Lead */}
        {lead && (
          <motion.button
            onClick={() => onPreview(lead.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative lg:col-span-2 aspect-[16/9] rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/[0.18] transition-all text-left"
            style={{ background: `linear-gradient(135deg, ${lead.gradient[0]}55, ${lead.gradient[1]}18)` }}
          >
            <div className="absolute inset-0">
              <BlueprintIllustration category={lead.category} gradient={lead.gradient} size="lg" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 backdrop-blur text-white flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Featured
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 backdrop-blur text-white/90 flex items-center gap-1">
                    {categoryMeta[lead.category].icon}{categoryMeta[lead.category].label}
                  </span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-medium text-white drop-shadow-sm">{lead.name}</h3>
                  <p className="text-sm text-white/70 mt-1 max-w-lg">{lead.tagline}</p>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-white/80 group-hover:translate-x-0.5 transition">
                  Explore <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </motion.button>
        )}

        {/* Side cards */}
        <div className="flex flex-col gap-3">
          {rest.slice(0, 2).map((tpl) => (
            <motion.button
              key={tpl.id}
              onClick={() => onPreview(tpl.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative flex-1 rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/[0.18] transition-all text-left"
              style={{ background: `linear-gradient(135deg, ${tpl.gradient[0]}44, ${tpl.gradient[1]}14)` }}
            >
              <div className="absolute inset-0 opacity-90">
                <BlueprintIllustration category={tpl.category} gradient={tpl.gradient} size="sm" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
              <div className="relative p-4 h-full flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tpl.name}</p>
                  <p className="text-[11px] text-white/60 line-clamp-2">{tpl.tagline}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/60">
                    <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{tpl.rating}</span>
                    <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{tpl.downloads.toLocaleString()}</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:translate-x-0.5 transition" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

function TemplateCard({
  tpl,
  onPreview,
  onInstall,
  installed,
  installing,
}: {
  tpl: MarketplaceTemplate
  onPreview: () => void
  onInstall: () => void
  installed: boolean
  installing: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] overflow-hidden transition-all"
    >
      {/* Animated preview header */}
      <button
        onClick={onPreview}
        className="relative w-full aspect-[16/10] block text-left overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${tpl.gradient[0]}40, ${tpl.gradient[1]}12)` }}
      >
        <div className="absolute inset-0 group-hover:scale-[1.03] transition-transform duration-500">
          <BlueprintIllustration category={tpl.category} gradient={tpl.gradient} size="sm" />
        </div>
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {tpl.isNew && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-success)]/80 text-white">New</span>
          )}
          {tpl.trending && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-warning)]/80 text-white flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> Trending
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span
            className="text-[9px] px-2 py-0.5 rounded-full text-white/90 backdrop-blur"
            style={{ backgroundColor: `${COMPLEXITY_META[tpl.complexity].color}55` }}
          >
            {COMPLEXITY_META[tpl.complexity].label}
          </span>
        </div>
      </button>

      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          {categoryMeta[tpl.category].icon}
          <p className="text-[10px] text-[var(--text-tertiary)]">{categoryMeta[tpl.category].label}</p>
        </div>
        <button onClick={onPreview} className="block text-left w-full">
          <h3 className="text-[13px] font-medium text-[var(--text-primary)] truncate">{tpl.name}</h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mt-0.5">{tpl.tagline}</p>
        </button>

        {/* Studio footprint strip — Product OS's "multi-studio bundle" at a glance */}
        <div className="flex items-center gap-1 mt-2.5" title={`Lights up ${tpl.studios.length} studios`}>
          {tpl.studios.slice(0, 6).map((s) => (
            <span
              key={s}
              className="w-5 h-5 rounded-md flex items-center justify-center border"
              style={{
                backgroundColor: `${STUDIO_META[s].color}18`,
                borderColor: `${STUDIO_META[s].color}33`,
                color: STUDIO_META[s].color,
              }}
              title={`${STUDIO_META[s].label} — ${STUDIO_META[s].hint}`}
            >
              {STUDIO_META[s].icon}
            </span>
          ))}
          {tpl.studios.length > 6 && (
            <span className="text-[9px] text-[var(--text-tertiary)] ml-0.5">+{tpl.studios.length - 6}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5 text-[var(--color-warning)]" />{tpl.rating}</span>
            <span className="flex items-center gap-1"><Download className="w-2.5 h-2.5" />{tpl.downloads.toLocaleString()}</span>
          </div>
          {installed ? (
            <span className="flex items-center gap-1 text-[10px] text-[var(--color-success)]">
              <Check className="w-3 h-3" /> Installed
            </span>
          ) : (
            <button
              onClick={onInstall}
              disabled={installing}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25 disabled:opacity-60 transition"
            >
              {installing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {installing ? 'Installing' : 'Install'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
        <Search className="w-5 h-5 text-[var(--text-tertiary)]" />
      </div>
      <div>
        <p className="text-[13px] text-[var(--text-primary)]">No web app ideas match your filters</p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Try a different category or clear your search.</p>
      </div>
    </div>
  )
}
