export interface PropDef {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum'
  defaultValue: string
  required: boolean
  description: string
  options?: string[] // for enum type
}

export interface VariantDef {
  id: string
  name: string
  props: Record<string, string>
}

export interface ComponentDef {
  id: string
  name: string
  category: 'Layout' | 'Form' | 'Data' | 'Feedback' | 'Navigation'
  description: string
  props: PropDef[]
  variants: VariantDef[]
  usageCount: number
}

export const categories = ['All', 'Layout', 'Form', 'Data', 'Feedback', 'Navigation'] as const

export type Category = (typeof categories)[number]

export const categoryColors: Record<string, string> = {
  Layout: '#8B5CF6',
  Form: '#06B6D4',
  Data: '#F59E0B',
  Feedback: '#EF4444',
  Navigation: '#10B981',
}

export const mockComponents: ComponentDef[] = [
  {
    id: 'comp-001',
    name: 'Button',
    category: 'Form',
    description: 'Interactive button with multiple variants and sizes for user actions.',
    props: [
      { id: 'p1', name: 'label', type: 'string', defaultValue: 'Click me', required: true, description: 'Button label text' },
      { id: 'p2', name: 'variant', type: 'enum', defaultValue: 'primary', required: false, description: 'Visual style variant', options: ['primary', 'secondary', 'ghost', 'destructive', 'outline'] },
      { id: 'p3', name: 'size', type: 'enum', defaultValue: 'md', required: false, description: 'Button size', options: ['sm', 'md', 'lg'] },
      { id: 'p4', name: 'disabled', type: 'boolean', defaultValue: 'false', required: false, description: 'Disable the button' },
      { id: 'p5', name: 'fullWidth', type: 'boolean', defaultValue: 'false', required: false, description: 'Stretch to full width' },
    ],
    variants: [
      { id: 'v1', name: 'Primary', props: { variant: 'primary', label: 'Primary' } },
      { id: 'v2', name: 'Secondary', props: { variant: 'secondary', label: 'Secondary' } },
      { id: 'v3', name: 'Ghost', props: { variant: 'ghost', label: 'Ghost' } },
      { id: 'v4', name: 'Destructive', props: { variant: 'destructive', label: 'Delete' } },
      { id: 'v5', name: 'Outline', props: { variant: 'outline', label: 'Outline' } },
    ],
    usageCount: 142,
  },
  {
    id: 'comp-002',
    name: 'Input',
    category: 'Form',
    description: 'Text input field with validation states and label support.',
    props: [
      { id: 'p1', name: 'placeholder', type: 'string', defaultValue: 'Enter text...', required: false, description: 'Placeholder text' },
      { id: 'p2', name: 'label', type: 'string', defaultValue: 'Label', required: false, description: 'Input label' },
      { id: 'p3', name: 'disabled', type: 'boolean', defaultValue: 'false', required: false, description: 'Disable the input' },
      { id: 'p4', name: 'error', type: 'boolean', defaultValue: 'false', required: false, description: 'Show error state' },
      { id: 'p5', name: 'helperText', type: 'string', defaultValue: '', required: false, description: 'Helper text below input' },
    ],
    variants: [
      { id: 'v1', name: 'Default', props: { placeholder: 'Enter text...', error: 'false' } },
      { id: 'v2', name: 'Error', props: { placeholder: 'Invalid input', error: 'true', helperText: 'This field is required' } },
      { id: 'v3', name: 'Disabled', props: { placeholder: 'Disabled', disabled: 'true' } },
    ],
    usageCount: 98,
  },
  {
    id: 'comp-003',
    name: 'Card',
    category: 'Layout',
    description: 'Container card with configurable elevation and border styles.',
    props: [
      { id: 'p1', name: 'title', type: 'string', defaultValue: 'Card Title', required: false, description: 'Card header title' },
      { id: 'p2', name: 'padding', type: 'enum', defaultValue: 'md', required: false, description: 'Inner padding', options: ['sm', 'md', 'lg'] },
      { id: 'p3', name: 'hoverable', type: 'boolean', defaultValue: 'false', required: false, description: 'Enable hover effect' },
    ],
    variants: [
      { id: 'v1', name: 'Default', props: { title: 'Default Card' } },
      { id: 'v2', name: 'Elevated', props: { title: 'Elevated Card', hoverable: 'true' } },
      { id: 'v3', name: 'Outlined', props: { title: 'Outlined Card' } },
    ],
    usageCount: 87,
  },
  {
    id: 'comp-004',
    name: 'Badge',
    category: 'Feedback',
    description: 'Small status indicator badge with color variants.',
    props: [
      { id: 'p1', name: 'label', type: 'string', defaultValue: 'Badge', required: true, description: 'Badge text' },
      { id: 'p2', name: 'variant', type: 'enum', defaultValue: 'default', required: false, description: 'Color variant', options: ['default', 'success', 'warning', 'error', 'info'] },
      { id: 'p3', name: 'size', type: 'enum', defaultValue: 'md', required: false, description: 'Badge size', options: ['sm', 'md'] },
    ],
    variants: [
      { id: 'v1', name: 'Default', props: { label: 'Default', variant: 'default' } },
      { id: 'v2', name: 'Success', props: { label: 'Success', variant: 'success' } },
      { id: 'v3', name: 'Warning', props: { label: 'Warning', variant: 'warning' } },
      { id: 'v4', name: 'Error', props: { label: 'Error', variant: 'error' } },
      { id: 'v5', name: 'Info', props: { label: 'Info', variant: 'info' } },
    ],
    usageCount: 63,
  },
  {
    id: 'comp-005',
    name: 'Avatar',
    category: 'Data',
    description: 'User avatar with size variants and fallback initials.',
    props: [
      { id: 'p1', name: 'name', type: 'string', defaultValue: 'John Doe', required: true, description: 'User name for initials' },
      { id: 'p2', name: 'size', type: 'enum', defaultValue: 'md', required: false, description: 'Avatar size', options: ['sm', 'md', 'lg'] },
      { id: 'p3', name: 'rounded', type: 'boolean', defaultValue: 'true', required: false, description: 'Fully rounded shape' },
    ],
    variants: [
      { id: 'v1', name: 'Small', props: { size: 'sm', name: 'AB' } },
      { id: 'v2', name: 'Medium', props: { size: 'md', name: 'JD' } },
      { id: 'v3', name: 'Large', props: { size: 'lg', name: 'SK' } },
    ],
    usageCount: 54,
  },
  {
    id: 'comp-006',
    name: 'Modal',
    category: 'Layout',
    description: 'Overlay dialog modal with configurable size and close behavior.',
    props: [
      { id: 'p1', name: 'title', type: 'string', defaultValue: 'Modal Title', required: true, description: 'Modal header title' },
      { id: 'p2', name: 'open', type: 'boolean', defaultValue: 'true', required: true, description: 'Controls visibility' },
      { id: 'p3', name: 'closable', type: 'boolean', defaultValue: 'true', required: false, description: 'Show close button' },
      { id: 'p4', name: 'size', type: 'enum', defaultValue: 'md', required: false, description: 'Modal width', options: ['sm', 'md', 'lg', 'full'] },
    ],
    variants: [
      { id: 'v1', name: 'Default', props: { title: 'Confirmation', size: 'md' } },
      { id: 'v2', name: 'Full-screen', props: { title: 'Editor', size: 'full' } },
    ],
    usageCount: 31,
  },
  {
    id: 'comp-007',
    name: 'Table',
    category: 'Data',
    description: 'Data table with sorting, density, and stripe options.',
    props: [
      { id: 'p1', name: 'striped', type: 'boolean', defaultValue: 'false', required: false, description: 'Alternate row colors' },
      { id: 'p2', name: 'compact', type: 'boolean', defaultValue: 'false', required: false, description: 'Reduced row height' },
      { id: 'p3', name: 'hoverable', type: 'boolean', defaultValue: 'true', required: false, description: 'Highlight rows on hover' },
      { id: 'p4', name: 'columns', type: 'number', defaultValue: '4', required: false, description: 'Number of columns' },
    ],
    variants: [
      { id: 'v1', name: 'Default', props: { striped: 'false', compact: 'false' } },
      { id: 'v2', name: 'Compact', props: { compact: 'true' } },
      { id: 'v3', name: 'Striped', props: { striped: 'true' } },
    ],
    usageCount: 45,
  },
  {
    id: 'comp-008',
    name: 'Tabs',
    category: 'Navigation',
    description: 'Tab navigation with multiple style variants.',
    props: [
      { id: 'p1', name: 'variant', type: 'enum', defaultValue: 'default', required: false, description: 'Tab style', options: ['default', 'pill', 'underline'] },
      { id: 'p2', name: 'items', type: 'number', defaultValue: '3', required: false, description: 'Number of tabs' },
      { id: 'p3', name: 'fullWidth', type: 'boolean', defaultValue: 'false', required: false, description: 'Stretch tabs to full width' },
    ],
    variants: [
      { id: 'v1', name: 'Default', props: { variant: 'default' } },
      { id: 'v2', name: 'Pill', props: { variant: 'pill' } },
      { id: 'v3', name: 'Underline', props: { variant: 'underline' } },
    ],
    usageCount: 37,
  },
  {
    id: 'comp-009',
    name: 'Alert',
    category: 'Feedback',
    description: 'Contextual alert message with icon and dismissible option.',
    props: [
      { id: 'p1', name: 'message', type: 'string', defaultValue: 'This is an alert message.', required: true, description: 'Alert message text' },
      { id: 'p2', name: 'variant', type: 'enum', defaultValue: 'info', required: false, description: 'Alert type', options: ['info', 'success', 'warning', 'error'] },
      { id: 'p3', name: 'dismissible', type: 'boolean', defaultValue: 'true', required: false, description: 'Show dismiss button' },
    ],
    variants: [
      { id: 'v1', name: 'Info', props: { variant: 'info', message: 'Informational alert' } },
      { id: 'v2', name: 'Success', props: { variant: 'success', message: 'Operation successful' } },
      { id: 'v3', name: 'Warning', props: { variant: 'warning', message: 'Proceed with caution' } },
      { id: 'v4', name: 'Error', props: { variant: 'error', message: 'Something went wrong' } },
    ],
    usageCount: 29,
  },
  {
    id: 'comp-010',
    name: 'Breadcrumb',
    category: 'Navigation',
    description: 'Navigation breadcrumb trail with configurable separator.',
    props: [
      { id: 'p1', name: 'separator', type: 'enum', defaultValue: 'slash', required: false, description: 'Separator character', options: ['slash', 'chevron', 'dot'] },
      { id: 'p2', name: 'items', type: 'number', defaultValue: '3', required: false, description: 'Number of breadcrumb items' },
    ],
    variants: [
      { id: 'v1', name: 'Default', props: { separator: 'slash' } },
      { id: 'v2', name: 'Separator', props: { separator: 'chevron' } },
    ],
    usageCount: 18,
  },
]
