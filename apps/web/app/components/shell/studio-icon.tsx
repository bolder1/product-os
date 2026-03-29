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
  type LucideIcon,
} from 'lucide-react'

const studioIconMap: Record<string, LucideIcon> = {
  planner: Compass,
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
}

const studioColorMap: Record<string, string> = {
  planner: '#3B82F6',
  templates: '#8B5CF6',
  canvas: '#6366F1',
  brand: '#EC4899',
  components: '#F59E0B',
  design: '#06B6D4',
  workflow: '#10B981',
  workflows: '#10B981',
  pages: '#3B82F6',
  code: '#64748B',
  handoff: '#94A3B8',
  graphics: '#EC4899',
  analytics: '#8B5CF6',
  tasks: '#F59E0B',
  approvals: '#10B981',
  decisions: '#F59E0B',
  notifications: '#F43F5E',
  releases: '#06B6D4',
  testing: '#F59E0B',
  controlTower: '#3B82F6',
  'control-tower': '#3B82F6',
  graphExplorer: '#6366F1',
  'graph-explorer': '#6366F1',
  settings: '#94A3B8',
}

interface StudioIconProps {
  studio: string
  size?: number
  className?: string
  useColor?: boolean
}

export function StudioIcon({ studio, size = 18, className = '', useColor = true }: StudioIconProps) {
  const IconComponent = studioIconMap[studio] ?? Compass
  const color = useColor ? studioColorMap[studio] ?? '#94A3B8' : 'currentColor'

  return <IconComponent size={size} style={{ color }} className={className} />
}

export function getStudioColor(studio: string): string {
  return studioColorMap[studio] ?? '#94A3B8'
}
