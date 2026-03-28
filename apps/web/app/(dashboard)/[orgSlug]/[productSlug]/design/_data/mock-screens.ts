// ── Design Studio Mock Data ──

export interface ElementDef {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  style: Record<string, string>
  content?: string
  children?: string[]
}

export interface ScreenDef {
  id: string
  name: string
  width: number
  height: number
  category: 'mobile' | 'tablet' | 'desktop'
  elements: ElementDef[]
}

export const mockScreens: ScreenDef[] = [
  // ── Mobile ──
  {
    id: 'scr-1',
    name: 'iPhone 15 - Home',
    width: 390,
    height: 844,
    category: 'mobile',
    elements: [
      {
        id: 'el-1-1',
        type: 'Container',
        x: 0,
        y: 0,
        width: 390,
        height: 64,
        style: { background: 'rgba(255,255,255,0.04)', borderRadius: '0' },
        content: 'Header',
      },
      {
        id: 'el-1-2',
        type: 'Image',
        x: 16,
        y: 80,
        width: 358,
        height: 200,
        style: { background: 'rgba(139,92,246,0.12)', borderRadius: '16px' },
        content: 'Hero Image',
      },
      {
        id: 'el-1-3',
        type: 'Grid',
        x: 16,
        y: 296,
        width: 358,
        height: 240,
        style: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px' },
        content: 'Feature Cards',
      },
      {
        id: 'el-1-4',
        type: 'Button',
        x: 80,
        y: 560,
        width: 230,
        height: 52,
        style: { background: 'rgba(139,92,246,0.25)', borderRadius: '12px' },
        content: 'Get Started',
      },
      {
        id: 'el-1-5',
        type: 'Container',
        x: 0,
        y: 780,
        width: 390,
        height: 64,
        style: { background: 'rgba(255,255,255,0.04)', borderRadius: '0' },
        content: 'Footer',
      },
    ],
  },
  {
    id: 'scr-2',
    name: 'iPhone 15 - Profile',
    width: 390,
    height: 844,
    category: 'mobile',
    elements: [
      {
        id: 'el-2-1',
        type: 'Container',
        x: 0,
        y: 0,
        width: 390,
        height: 64,
        style: { background: 'rgba(255,255,255,0.04)', borderRadius: '0' },
        content: 'Header',
      },
      {
        id: 'el-2-2',
        type: 'Avatar',
        x: 145,
        y: 96,
        width: 100,
        height: 100,
        style: { background: 'rgba(139,92,246,0.18)', borderRadius: '50%' },
        content: 'Avatar',
      },
      {
        id: 'el-2-3',
        type: 'Card',
        x: 24,
        y: 220,
        width: 342,
        height: 260,
        style: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px' },
        content: 'User Info Card',
      },
      {
        id: 'el-2-4',
        type: 'Stack',
        x: 24,
        y: 504,
        width: 342,
        height: 56,
        style: { background: 'rgba(139,92,246,0.15)', borderRadius: '12px' },
        content: 'Action Buttons',
      },
    ],
  },

  // ── Tablet ──
  {
    id: 'scr-3',
    name: 'iPad - Dashboard',
    width: 1024,
    height: 768,
    category: 'tablet',
    elements: [
      {
        id: 'el-3-1',
        type: 'Container',
        x: 0,
        y: 0,
        width: 220,
        height: 768,
        style: { background: 'rgba(255,255,255,0.03)', borderRadius: '0' },
        content: 'Sidebar',
      },
      {
        id: 'el-3-2',
        type: 'Container',
        x: 220,
        y: 0,
        width: 804,
        height: 56,
        style: { background: 'rgba(255,255,255,0.04)', borderRadius: '0' },
        content: 'Header',
      },
      {
        id: 'el-3-3',
        type: 'Grid',
        x: 244,
        y: 72,
        width: 756,
        height: 120,
        style: { background: 'rgba(139,92,246,0.08)', borderRadius: '12px' },
        content: 'Stat Cards',
      },
      {
        id: 'el-3-4',
        type: 'Card',
        x: 244,
        y: 208,
        width: 756,
        height: 240,
        style: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px' },
        content: 'Chart Area',
      },
      {
        id: 'el-3-5',
        type: 'Card',
        x: 244,
        y: 464,
        width: 756,
        height: 200,
        style: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px' },
        content: 'Data Table',
      },
      {
        id: 'el-3-6',
        type: 'Container',
        x: 220,
        y: 720,
        width: 804,
        height: 48,
        style: { background: 'rgba(255,255,255,0.02)', borderRadius: '0' },
        content: 'Footer',
      },
    ],
  },

  // ── Desktop ──
  {
    id: 'scr-4',
    name: 'Desktop - Landing',
    width: 1440,
    height: 900,
    category: 'desktop',
    elements: [
      {
        id: 'el-4-1',
        type: 'Container',
        x: 0,
        y: 0,
        width: 1440,
        height: 64,
        style: { background: 'rgba(255,255,255,0.04)', borderRadius: '0' },
        content: 'Navigation',
      },
      {
        id: 'el-4-2',
        type: 'Container',
        x: 120,
        y: 88,
        width: 1200,
        height: 320,
        style: { background: 'rgba(139,92,246,0.06)', borderRadius: '24px' },
        content: 'Hero Section',
      },
      {
        id: 'el-4-3',
        type: 'Grid',
        x: 120,
        y: 432,
        width: 1200,
        height: 160,
        style: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px' },
        content: 'Features Grid',
      },
      {
        id: 'el-4-4',
        type: 'Card',
        x: 120,
        y: 616,
        width: 580,
        height: 140,
        style: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px' },
        content: 'Testimonials',
      },
      {
        id: 'el-4-5',
        type: 'Card',
        x: 720,
        y: 616,
        width: 600,
        height: 140,
        style: { background: 'rgba(139,92,246,0.10)', borderRadius: '16px' },
        content: 'Pricing',
      },
      {
        id: 'el-4-6',
        type: 'Button',
        x: 560,
        y: 780,
        width: 320,
        height: 56,
        style: { background: 'rgba(139,92,246,0.25)', borderRadius: '14px' },
        content: 'Start Free Trial',
      },
      {
        id: 'el-4-7',
        type: 'Container',
        x: 0,
        y: 856,
        width: 1440,
        height: 44,
        style: { background: 'rgba(255,255,255,0.02)', borderRadius: '0' },
        content: 'Footer',
      },
    ],
  },
]

// ── Element palette categories ──

export interface PaletteElement {
  type: string
  icon: string
  category: 'Layout' | 'Text' | 'Media' | 'Form' | 'Data'
}

export const paletteElements: PaletteElement[] = [
  // Layout
  { type: 'Container', icon: 'Square', category: 'Layout' },
  { type: 'Stack', icon: 'AlignVerticalSpaceAround', category: 'Layout' },
  { type: 'Grid', icon: 'LayoutGrid', category: 'Layout' },
  { type: 'Divider', icon: 'Minus', category: 'Layout' },
  // Text
  { type: 'Heading', icon: 'Heading', category: 'Text' },
  { type: 'Paragraph', icon: 'AlignLeft', category: 'Text' },
  { type: 'Link', icon: 'ExternalLink', category: 'Text' },
  // Media
  { type: 'Image', icon: 'Image', category: 'Media' },
  { type: 'Icon', icon: 'Star', category: 'Media' },
  { type: 'Avatar', icon: 'CircleUser', category: 'Media' },
  // Form
  { type: 'Button', icon: 'MousePointerClick', category: 'Form' },
  { type: 'Input', icon: 'TextCursorInput', category: 'Form' },
  { type: 'Select', icon: 'ChevronsUpDown', category: 'Form' },
  { type: 'Checkbox', icon: 'CheckSquare', category: 'Form' },
  // Data
  { type: 'Card', icon: 'CreditCard', category: 'Data' },
  { type: 'Badge', icon: 'Tag', category: 'Data' },
]
