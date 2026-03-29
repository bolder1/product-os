export interface CanvasItem {
  id: string
  type: 'sticky' | 'text' | 'shape'
  shapeKind?: 'rectangle' | 'circle' | 'diamond'
  x: number
  y: number
  width: number
  height: number
  text: string
  color: string
}

export const mockCanvasItems: CanvasItem[] = [
  {
    id: 'item-1',
    type: 'sticky',
    x: 120,
    y: 100,
    width: 180,
    height: 140,
    text: 'Problem Space',
    color: '#F59E0B',
  },
  {
    id: 'item-2',
    type: 'sticky',
    x: 380,
    y: 80,
    width: 180,
    height: 140,
    text: 'User Needs',
    color: '#3B82F6',
  },
  {
    id: 'item-3',
    type: 'sticky',
    x: 640,
    y: 120,
    width: 180,
    height: 140,
    text: 'Technical Constraints',
    color: '#EC4899',
  },
  {
    id: 'item-4',
    type: 'shape',
    shapeKind: 'rectangle',
    x: 200,
    y: 320,
    width: 160,
    height: 100,
    text: 'MVP Scope',
    color: '#10B981',
  },
  {
    id: 'item-5',
    type: 'shape',
    shapeKind: 'diamond',
    x: 500,
    y: 340,
    width: 120,
    height: 120,
    text: 'Decision',
    color: '#8B5CF6',
  },
  {
    id: 'item-6',
    type: 'text',
    x: 150,
    y: 500,
    width: 260,
    height: 60,
    text: 'Key insight: users need faster onboarding flow',
    color: '#F1F5F9',
  },
]

export const presetColors = [
  '#F59E0B',
  '#3B82F6',
  '#EC4899',
  '#10B981',
  '#8B5CF6',
  '#EF4444',
]
