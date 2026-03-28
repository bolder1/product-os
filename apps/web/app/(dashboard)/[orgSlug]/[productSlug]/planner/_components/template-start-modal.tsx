'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, FileText, Rocket, Globe, Boxes } from 'lucide-react'
import type { PlanData } from '../page'

const templates: Array<{
  id: string
  name: string
  description: string
  nodeCount: number
  tags: string[]
  icon: React.ReactNode
  data: PlanData
}> = [
  {
    id: 'saas-starter',
    name: 'SaaS Starter',
    description: 'Full SaaS product with auth, billing, dashboards, and multi-tenancy. Perfect for B2B products.',
    nodeCount: 42,
    tags: ['B2B', 'Auth', 'Billing', 'Dashboard'],
    icon: <Rocket className="w-6 h-6" />,
    data: {
      problem: 'Building a modern SaaS platform that enables businesses to manage their operations efficiently. Current solutions are fragmented, expensive, and lack the flexibility needed for growing teams. Teams waste hours switching between tools and manually syncing data.',
      goals: [
        { id: '1', text: 'Acquire 1,000 paying customers in first year', category: 'Growth' },
        { id: '2', text: 'Achieve 95% monthly retention rate', category: 'Engagement' },
        { id: '3', text: 'Reach $100K ARR within 18 months', category: 'Revenue' },
        { id: '4', text: 'Reduce customer onboarding time to under 5 minutes', category: 'Efficiency' },
      ],
      personas: [
        { id: '1', name: 'Startup Steve', role: 'Founder / CEO', painPoints: ['Too many tools', 'Manual data entry', 'Limited budget'], needs: ['All-in-one platform', 'Affordable pricing', 'Quick setup'] },
        { id: '2', name: 'Manager Maria', role: 'Operations Manager', painPoints: ['No visibility into team work', 'Slow reporting', 'Data silos'], needs: ['Real-time dashboards', 'Automated reports', 'Team collaboration'] },
      ],
      features: [
        { id: '1', name: 'User Authentication', description: 'Email/password + OAuth sign-in with MFA support', priority: 'must-have' },
        { id: '2', name: 'Team Management', description: 'Invite members, assign roles, manage permissions', priority: 'must-have' },
        { id: '3', name: 'Dashboard', description: 'Customizable analytics dashboard with widgets', priority: 'must-have' },
        { id: '4', name: 'Billing & Subscriptions', description: 'Stripe integration with usage-based billing', priority: 'must-have' },
        { id: '5', name: 'API Access', description: 'REST + GraphQL API for third-party integrations', priority: 'should-have' },
        { id: '6', name: 'Notifications', description: 'In-app, email, and Slack notifications', priority: 'should-have' },
      ],
      entities: [
        { id: '1', name: 'Organization', description: 'Top-level tenant', fields: [{ name: 'name', type: 'text' }, { name: 'slug', type: 'text' }, { name: 'plan', type: 'enum' }] },
        { id: '2', name: 'User', description: 'Application user', fields: [{ name: 'email', type: 'text' }, { name: 'name', type: 'text' }, { name: 'role', type: 'enum' }] },
        { id: '3', name: 'Subscription', description: 'Billing subscription', fields: [{ name: 'plan', type: 'enum' }, { name: 'status', type: 'enum' }, { name: 'expiresAt', type: 'date' }] },
      ],
      activeStudios: ['planner', 'canvas', 'pages', 'components', 'workflows', 'analytics', 'templates', 'releases'],
    },
  },
  {
    id: 'ops-pilot',
    name: 'OpsPilot',
    description: 'Internal operations intelligence tool with AI-powered workflows, task management, and reporting.',
    nodeCount: 35,
    tags: ['Internal', 'AI', 'Workflows', 'Ops'],
    icon: <Boxes className="w-6 h-6" />,
    data: {
      problem: 'Operations teams struggle with disconnected tools and manual processes. Status updates are scattered across Slack, email, and spreadsheets. No single source of truth for operational health and no way to automate repetitive tasks.',
      goals: [
        { id: '1', text: 'Reduce operational overhead by 40%', category: 'Efficiency' },
        { id: '2', text: 'Centralize all ops data in one dashboard', category: 'Efficiency' },
        { id: '3', text: 'Automate 80% of recurring tasks', category: 'Efficiency' },
        { id: '4', text: 'Improve cross-team visibility', category: 'Engagement' },
      ],
      personas: [
        { id: '1', name: 'Ops Oscar', role: 'Operations Lead', painPoints: ['Manual status tracking', 'Too many meetings', 'No automation'], needs: ['Automated workflows', 'Real-time dashboards', 'AI assistant'] },
      ],
      features: [
        { id: '1', name: 'Task Automation', description: 'Visual workflow builder for automating operational tasks', priority: 'must-have' },
        { id: '2', name: 'Ops Dashboard', description: 'Real-time operational health metrics', priority: 'must-have' },
        { id: '3', name: 'AI Copilot', description: 'AI-powered suggestions for task prioritization', priority: 'should-have' },
        { id: '4', name: 'Integrations', description: 'Connect Slack, Jira, GitHub, and more', priority: 'must-have' },
      ],
      entities: [
        { id: '1', name: 'Task', description: 'Operational task', fields: [{ name: 'title', type: 'text' }, { name: 'status', type: 'enum' }, { name: 'assignee', type: 'relation' }, { name: 'dueDate', type: 'date' }] },
        { id: '2', name: 'Workflow', description: 'Automated workflow', fields: [{ name: 'name', type: 'text' }, { name: 'trigger', type: 'enum' }, { name: 'steps', type: 'json' }] },
      ],
      activeStudios: ['planner', 'workflows', 'tasks', 'analytics', 'notifications', 'control-tower'],
    },
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Marketing landing page with A/B testing, analytics, and CMS. Ship your marketing site fast.',
    nodeCount: 18,
    tags: ['Marketing', 'CMS', 'A/B Testing'],
    icon: <Globe className="w-6 h-6" />,
    data: {
      problem: 'Marketing teams need to ship landing pages fast but are blocked by engineering. Design-to-code handoff is slow, and there\'s no way to run A/B tests without developer involvement. Analytics are an afterthought.',
      goals: [
        { id: '1', text: 'Ship landing pages in under 1 hour', category: 'Efficiency' },
        { id: '2', text: 'Achieve 5% conversion rate on primary CTA', category: 'Growth' },
        { id: '3', text: 'Enable non-technical team to manage content', category: 'Efficiency' },
      ],
      personas: [
        { id: '1', name: 'Marketer Maya', role: 'Growth Marketer', painPoints: ['Slow page creation', 'No A/B testing', 'Depends on devs'], needs: ['Visual editor', 'Quick publishing', 'Built-in analytics'] },
      ],
      features: [
        { id: '1', name: 'Visual Page Builder', description: 'Drag-and-drop page construction with components', priority: 'must-have' },
        { id: '2', name: 'CMS', description: 'Manage page content, images, and copy', priority: 'must-have' },
        { id: '3', name: 'A/B Testing', description: 'Run conversion experiments on any element', priority: 'should-have' },
        { id: '4', name: 'Analytics', description: 'Track page views, clicks, and conversions', priority: 'must-have' },
      ],
      entities: [
        { id: '1', name: 'Page', description: 'Landing page', fields: [{ name: 'title', type: 'text' }, { name: 'slug', type: 'text' }, { name: 'content', type: 'json' }, { name: 'published', type: 'boolean' }] },
        { id: '2', name: 'Experiment', description: 'A/B test', fields: [{ name: 'name', type: 'text' }, { name: 'variants', type: 'json' }, { name: 'status', type: 'enum' }] },
      ],
      activeStudios: ['planner', 'pages', 'design', 'brand', 'graphics', 'analytics', 'templates'],
    },
  },
]

interface TemplateStartModalProps {
  open: boolean
  onClose: () => void
  onApplyTemplate: (data: PlanData) => void
}

export default function TemplateStartModal({ open, onClose, onApplyTemplate }: TemplateStartModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#060918]/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative z-10 w-full max-w-3xl mx-4 bg-[#0C1024] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#8B5CF6]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F1F5F9]">Start from Template</h2>
                  <p className="text-xs text-[#64748B]">Choose a template to pre-fill your product plan</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            {/* Template Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-[#8B5CF6]/30 transition-colors group"
                >
                  {/* Icon / Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] group-hover:bg-[#8B5CF6]/20 transition-colors">
                    {template.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">{template.name}</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">{template.description}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#64748B]">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-[#64748B]">{template.nodeCount} nodes</span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onApplyTemplate(template.data)
                          onClose()
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/90 transition-colors font-medium"
                      >
                        Use
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[#94A3B8] hover:bg-white/[0.08] transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Remix
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
