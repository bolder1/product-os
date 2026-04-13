'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FileNode {
  path: string
  name: string
  language: 'tsx' | 'ts' | 'css' | 'json' | 'md' | 'html' | 'yaml' | 'sql' | 'graphql'
  content: string
  folder: string
}

export interface CodeModule {
  id: string
  productId: string
  label: string
  name: string
  description?: string
  files: FileNode[]
  entryPoint?: string
  dependencies: string[]
  createdAt?: string
  updatedAt?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseModule(raw: Record<string, unknown>): CodeModule {
  const data = (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) ?? {}
  return {
    id: raw.id as string,
    productId: raw.productId as string,
    label: raw.label as string,
    name: data.name ?? raw.label ?? '',
    description: data.description,
    files: data.files ?? [],
    entryPoint: data.entryPoint,
    dependencies: data.dependencies ?? [],
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface CodeState {
  modules: CodeModule[]
  selectedModuleId: string | null
  selectedFilePath: string | null
  openPaths: string[]
  search: string
  loading: boolean

  hydrate: (raw: Record<string, unknown>[]) => void
  selectModule: (id: string | null) => void
  selectFile: (path: string | null) => void
  openFile: (path: string) => void
  closeFile: (path: string) => void
  setSearch: (q: string) => void

  createModule: (mod: Omit<CodeModule, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateModule: (id: string, patch: Partial<CodeModule>) => void
  removeModule: (id: string) => void

  upsertFile: (moduleId: string, file: FileNode) => void
  removeFile: (moduleId: string, path: string) => void
}

export const useCodeStore = create<CodeState>()(
  persist(
    (set, get) => ({
      modules: [],
      selectedModuleId: null,
      selectedFilePath: null,
      openPaths: [],
      search: '',
      loading: false,

      hydrate: (raw) => set({ modules: raw.map(parseModule), loading: false }),

      selectModule: (id) => set({ selectedModuleId: id, selectedFilePath: null, openPaths: [] }),
      selectFile: (path) => {
        if (path && !get().openPaths.includes(path)) {
          set({ selectedFilePath: path, openPaths: [...get().openPaths, path] })
        } else {
          set({ selectedFilePath: path })
        }
      },
      openFile: (path) => {
        if (!get().openPaths.includes(path)) {
          set({ openPaths: [...get().openPaths, path], selectedFilePath: path })
        } else {
          set({ selectedFilePath: path })
        }
      },
      closeFile: (path) => {
        const { openPaths, selectedFilePath } = get()
        const next = openPaths.filter((p) => p !== path)
        set({
          openPaths: next,
          selectedFilePath: selectedFilePath === path ? (next[next.length - 1] ?? null) : selectedFilePath,
        })
      },
      setSearch: (q) => set({ search: q }),

      createModule: (mod) => {
        const id = crypto.randomUUID()
        set({ modules: [{ ...mod, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...get().modules] })
      },
      updateModule: (id, patch) =>
        set({
          modules: get().modules.map((m) =>
            m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m,
          ),
        }),
      removeModule: (id) => set({ modules: get().modules.filter((m) => m.id !== id) }),

      upsertFile: (moduleId, file) =>
        set({
          modules: get().modules.map((m) => {
            if (m.id !== moduleId) return m
            const files = [...m.files]
            const idx = files.findIndex((f) => f.path === file.path)
            if (idx >= 0) files[idx] = file
            else files.push(file)
            return { ...m, files }
          }),
        }),
      removeFile: (moduleId, path) =>
        set({
          modules: get().modules.map((m) => {
            if (m.id !== moduleId) return m
            return { ...m, files: m.files.filter((f) => f.path !== path) }
          }),
        }),
    }),
    { name: 'product-os-code-store', partialize: (s) => ({ selectedModuleId: s.selectedModuleId }) },
  ),
)
