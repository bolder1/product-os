'use client'

import {
  Compass,
  LayoutGrid,
  Paintbrush,
  Palette,
  Blocks,
  PenTool,
  GitBranch,
  FileText,
  Code,
  Package,
  Image,
  BarChart3,
  CheckSquare,
  ShieldCheck,
  Bell,
  BookOpen,
  Rocket,
  FlaskConical,
  Gauge,
  Network,
  ListChecks,
  Home,
  Plug,
  Sparkles,
  Map,
  CalendarDays,
  Database,
  Activity,
  type LucideIcon,
} from 'lucide-react'

const studioIconMap: Record<string, LucideIcon> = {
  home: Home,
  planner: Compass,
  features: ListChecks,
  templates: LayoutGrid,
  canvas: Paintbrush,
  brand: Palette,
  components: Blocks,
  design: PenTool,
  workflow: GitBranch,
  workflows: GitBranch,
  pages: FileText,
  code: Code,
  handoff: Package,
  graphics: Image,
  analytics: BarChart3,
  tasks: CheckSquare,
  approvals: ShieldCheck,
  decisions: BookOpen,
  notifications: Bell,
  releases: Rocket,
  testing: FlaskConical,
  controlTower: Gauge,
  'control-tower': Gauge,
  graphExplorer: Network,
  'graph-explorer': Network,
  connectors: Plug,
  roadmap: Map,
  'ai-skills': Sparkles,
  'brand-compliance': ShieldCheck,
  agenda: CalendarDays,
  memory: Database,
  graph: Activity,
}

const ACTIVE_COLOR = '#6398ff'
const INACTIVE_COLOR = 'currentColor'

interface StudioIconProps {
  studio: string
  size?: number
  className?: string
  useColor?: boolean
}

export function StudioIcon({ studio, size = 16, className = '', useColor = false }: StudioIconProps) {
  const IconComponent = studioIconMap[studio] ?? Compass
  const color = useColor ? ACTIVE_COLOR : INACTIVE_COLOR

  return <IconComponent size={size} style={{ color }} className={className} strokeWidth={1.75} />
}

export function getStudioColor(_studio: string): string {
  return ACTIVE_COLOR
}
