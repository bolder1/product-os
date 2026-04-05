'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trpcMutate } from './api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectorType = 'jira' | 'figma' | 'github' | 'slack' | 'google-analytics' | 'stripe' | 'notion' | 'custom'
export type SyncDirection = 'pull' | 'push' | 'bidirectional'
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'
export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending'

export interface ConnectorInstance {
  id: string
  type: ConnectorType
  name: string
  productId: string
  status: ConnectorStatus
  syncDirection: SyncDirection
  syncStatus: SyncStatus
  lastSyncAt: string | null
  syncInterval: number // minutes, 0 = manual
  mappings: ExternalObjectMapping[]
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ExternalObjectMapping {
  id: string
  connectorId: string
  externalId: string
  externalType: string // e.g., 'jira-issue', 'figma-component', 'github-pr'
  localNodeId: string
  localNodeKind: string
  lastPulledAt: string | null
  lastPushedAt: string | null
  conflictState: 'none' | 'local-ahead' | 'remote-ahead' | 'conflict'
}

export interface SyncLogEntry {
  id: string
  connectorId: string
  direction: 'pull' | 'push'
  status: 'success' | 'error' | 'partial'
  objectsAffected: number
  message: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Connector Registry (available connector types)
// ---------------------------------------------------------------------------

export interface ConnectorDefinition {
  type: ConnectorType
  label: string
  description: string
  icon: string // emoji for simplicity
  supportedMappings: string[]
  defaultSyncDirection: SyncDirection
}

export const connectorRegistry: ConnectorDefinition[] = [
  {
    type: 'jira',
    label: 'Jira',
    description: 'Sync tasks, workflows, and issue states from Jira projects.',
    icon: '🔵',
    supportedMappings: ['jira-issue', 'jira-epic', 'jira-sprint', 'jira-board'],
    defaultSyncDirection: 'bidirectional',
  },
  {
    type: 'figma',
    label: 'Figma',
    description: 'Import design components, tokens, and styles from Figma files.',
    icon: '🎨',
    supportedMappings: ['figma-component', 'figma-style', 'figma-variable', 'figma-page'],
    defaultSyncDirection: 'pull',
  },
  {
    type: 'github',
    label: 'GitHub',
    description: 'Track repos, PRs, commits, and implementation status.',
    icon: '🐙',
    supportedMappings: ['github-repo', 'github-pr', 'github-issue', 'github-commit'],
    defaultSyncDirection: 'bidirectional',
  },
  {
    type: 'slack',
    label: 'Slack',
    description: 'Capture conversations, decisions, and route alerts to channels.',
    icon: '💬',
    supportedMappings: ['slack-channel', 'slack-message', 'slack-thread'],
    defaultSyncDirection: 'bidirectional',
  },
  {
    type: 'google-analytics',
    label: 'Google Analytics',
    description: 'Pull product usage data, page views, and funnel metrics.',
    icon: '📊',
    supportedMappings: ['ga-property', 'ga-event', 'ga-conversion'],
    defaultSyncDirection: 'pull',
  },
  {
    type: 'stripe',
    label: 'Stripe',
    description: 'Import subscription, payment, and revenue data.',
    icon: '💳',
    supportedMappings: ['stripe-product', 'stripe-price', 'stripe-subscription'],
    defaultSyncDirection: 'pull',
  },
  {
    type: 'notion',
    label: 'Notion',
    description: 'Sync documents, databases, and knowledge base content.',
    icon: '📝',
    supportedMappings: ['notion-page', 'notion-database', 'notion-block'],
    defaultSyncDirection: 'bidirectional',
  },
  {
    type: 'custom',
    label: 'Custom API',
    description: 'Connect any REST/GraphQL API with configurable mappings.',
    icon: '🔌',
    supportedMappings: ['custom-object'],
    defaultSyncDirection: 'pull',
  },
]

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ConnectorState {
  connectors: ConnectorInstance[]
  syncLogs: SyncLogEntry[]

  // CRUD
  addConnector: (connector: Omit<ConnectorInstance, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'lastSyncAt' | 'mappings'>) => ConnectorInstance
  updateConnector: (id: string, updates: Partial<ConnectorInstance>) => void
  deleteConnector: (id: string) => void
  getConnectorsByProduct: (productId: string) => ConnectorInstance[]

  // Sync operations
  triggerSync: (id: string) => void
  addSyncLog: (entry: Omit<SyncLogEntry, 'id' | 'timestamp'>) => void

  // Mapping operations
  addMapping: (connectorId: string, mapping: Omit<ExternalObjectMapping, 'id' | 'lastPulledAt' | 'lastPushedAt' | 'conflictState'>) => void
  removeMapping: (connectorId: string, mappingId: string) => void
}

let counter = 0
function uid(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

export const useConnectorStore = create<ConnectorState>()(
  persist(
    (set, get) => ({
      connectors: [],
      syncLogs: [],

      addConnector: (input) => {
        const now = new Date().toISOString()
        const tempId = uid('conn')
        const connector: ConnectorInstance = {
          ...input,
          id: tempId,
          syncStatus: 'idle',
          lastSyncAt: null,
          mappings: [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ connectors: [...s.connectors, connector] }))

        // Persist to DB (fire-and-forget)
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('product-os-org-id') : null
        if (orgId) {
          const dbType = input.type === 'google-analytics' ? 'google_analytics' : input.type
          trpcMutate<{ id: string }>('connector.create', {
            orgId,
            type: dbType,
            name: input.name,
            settings: input.config,
          }).then((result) => {
            if (result?.id) {
              set((s) => ({
                connectors: s.connectors.map((c) => (c.id === tempId ? { ...c, id: result.id } : c)),
              }))
            }
          }).catch(() => {})
        }

        return connector
      },

      updateConnector: (id, updates) =>
        set((s) => ({
          connectors: s.connectors.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteConnector: (id) => {
        set((s) => ({
          connectors: s.connectors.filter((c) => c.id !== id),
          syncLogs: s.syncLogs.filter((l) => l.connectorId !== id),
        }))
        trpcMutate('connector.delete', { id }).catch(() => {})
      },

      getConnectorsByProduct: (productId) =>
        get().connectors.filter((c) => c.productId === productId),

      triggerSync: (id) => {
        const connector = get().connectors.find((c) => c.id === id)
        if (!connector) return

        // Set syncing state
        get().updateConnector(id, { syncStatus: 'syncing' })

        // Simulate sync completion
        setTimeout(() => {
          const objectCount = Math.floor(Math.random() * 20) + 1
          get().updateConnector(id, {
            syncStatus: 'success',
            lastSyncAt: new Date().toISOString(),
          })
          get().addSyncLog({
            connectorId: id,
            direction: connector.syncDirection === 'push' ? 'push' : 'pull',
            status: 'success',
            objectsAffected: objectCount,
            message: `Synced ${objectCount} objects from ${connector.name}`,
          })
        }, 1500 + Math.random() * 1000)
      },

      addSyncLog: (entry) =>
        set((s) => ({
          syncLogs: [
            { ...entry, id: uid('log'), timestamp: new Date().toISOString() },
            ...s.syncLogs,
          ].slice(0, 100), // keep last 100
        })),

      addMapping: (connectorId, mapping) =>
        set((s) => ({
          connectors: s.connectors.map((c) =>
            c.id === connectorId
              ? {
                  ...c,
                  mappings: [
                    ...c.mappings,
                    {
                      ...mapping,
                      id: uid('map'),
                      lastPulledAt: null,
                      lastPushedAt: null,
                      conflictState: 'none',
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),

      removeMapping: (connectorId, mappingId) =>
        set((s) => ({
          connectors: s.connectors.map((c) =>
            c.id === connectorId
              ? { ...c, mappings: c.mappings.filter((m) => m.id !== mappingId) }
              : c
          ),
        })),
    }),
    { name: 'product-os-connectors' }
  )
)
