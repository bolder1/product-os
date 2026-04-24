/**
 * Mock canvas items and the user-facing color palette for the whiteboard
 * surface. Canvas items carry their own color as user-authored data — the
 * hex values here are the *content* a user would persist (sticky-note color,
 * shape fill, etc.), not studio chrome. R20 leaves these literal and
 * eslint-disables the lines.
 */

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
    // eslint-disable-next-line no-hardcoded-hex -- user-authored sticky-note color
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
    // eslint-disable-next-line no-hardcoded-hex -- user-authored sticky-note color
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
    // eslint-disable-next-line no-hardcoded-hex -- user-authored sticky-note color
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
    // eslint-disable-next-line no-hardcoded-hex -- user-authored shape fill
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
    // eslint-disable-next-line no-hardcoded-hex -- user-authored shape fill
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
    // eslint-disable-next-line no-hardcoded-hex -- user-authored text fill
    color: '#F1F5F9',
  },
]

// User-facing palette shown in the canvas toolbar; users pick one to fill
// their next sticky/shape/text. These are the *options*, not chrome.
export const presetColors = [
  // eslint-disable-next-line no-hardcoded-hex -- user-facing canvas color palette
  '#F59E0B',
  // eslint-disable-next-line no-hardcoded-hex -- user-facing canvas color palette
  '#3B82F6',
  // eslint-disable-next-line no-hardcoded-hex -- user-facing canvas color palette
  '#EC4899',
  // eslint-disable-next-line no-hardcoded-hex -- user-facing canvas color palette
  '#10B981',
  // eslint-disable-next-line no-hardcoded-hex -- user-facing canvas color palette
  '#8B5CF6',
  // eslint-disable-next-line no-hardcoded-hex -- user-facing canvas color palette
  '#EF4444',
]
