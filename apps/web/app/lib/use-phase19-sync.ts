'use client'

import { useEffect } from 'react'
import { trpc } from './trpc'
import { useAuthStore } from './auth-store'
import { useCodeStore } from './code-store'
import { useHandoffStore } from './handoff-store'
import { useAnalyticsStore } from './analytics-store'
import { useReleaseStore } from './release-store'
import { useTestingStore } from './testing-store'
import { useGraphicsStore } from './graphics-store'

/**
 * Hydrates Phase 19 studio stores (code, handoff, analytics, release,
 * testing, graphics) from the tRPC routers that back them.
 *
 * Mirrors the responsibilities of `use-data-sync` for Phase 19 content so
 * that the UI reads live graph data instead of mock fixtures.
 */
export function usePhase19Sync(productId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  const enabled = !!user && !!productId

  /* ---------- Code modules ---------------------------------------- */
  const codeQuery = trpc.code.list.useQuery(
    { productId: productId! },
    { enabled },
  )
  useEffect(() => {
    if (!codeQuery.data) return
    useCodeStore.getState().hydrate(codeQuery.data as Record<string, unknown>[])
  }, [codeQuery.data])

  /* ---------- Handoff items --------------------------------------- */
  const handoffQuery = trpc.handoff.list.useQuery(
    { productId: productId!, type: 'all' },
    { enabled },
  )
  useEffect(() => {
    if (!handoffQuery.data) return
    useHandoffStore.getState().hydrate(handoffQuery.data as Record<string, unknown>[])
  }, [handoffQuery.data])

  /* ---------- Analytics dashboard --------------------------------- */
  const dashboardQuery = trpc.analytics.getDashboard.useQuery(
    { productId: productId!, dateRange: '30d' },
    { enabled },
  )
  useEffect(() => {
    if (!dashboardQuery.data) return
    const row = dashboardQuery.data as Record<string, unknown> | null
    if (!row) return
    const raw = (row.data ?? {}) as Record<string, unknown>
    const parse = <T>(v: unknown): T[] =>
      (typeof v === 'string' ? JSON.parse(v) : v ?? []) as T[]
    useAnalyticsStore.getState().hydrate({
      metrics: parse(raw.metrics),
      dailyTraffic: parse(raw.dailyTraffic),
      funnel: parse(raw.funnel),
      topPages: parse(raw.topPages),
      insights: parse(raw.insights),
    })
  }, [dashboardQuery.data])

  /* ---------- Analytics experiments ------------------------------- */
  const experimentsQuery = trpc.analytics.listExperiments.useQuery(
    { productId: productId! },
    { enabled },
  )
  useEffect(() => {
    if (!experimentsQuery.data) return
    useAnalyticsStore
      .getState()
      .hydrateExperiments(experimentsQuery.data as Record<string, unknown>[])
  }, [experimentsQuery.data])

  /* ---------- Releases -------------------------------------------- */
  const releaseQuery = trpc.release.list.useQuery(
    { productId: productId!, status: 'all' },
    { enabled },
  )
  useEffect(() => {
    if (!releaseQuery.data) return
    useReleaseStore.getState().hydrate(releaseQuery.data as Record<string, unknown>[])
  }, [releaseQuery.data])

  /* ---------- Testing suites + runs + coverage -------------------- */
  const suitesQuery = trpc.testing.listSuites.useQuery(
    { productId: productId! },
    { enabled },
  )
  useEffect(() => {
    if (!suitesQuery.data) return
    useTestingStore.getState().hydrateSuites(suitesQuery.data as Record<string, unknown>[])
  }, [suitesQuery.data])

  const runsQuery = trpc.testing.listRuns.useQuery(
    { productId: productId!, limit: 20 },
    { enabled },
  )
  useEffect(() => {
    if (!runsQuery.data) return
    useTestingStore.getState().hydrateRuns(runsQuery.data as Record<string, unknown>[])
  }, [runsQuery.data])

  const coverageQuery = trpc.testing.getCoverage.useQuery(
    { productId: productId! },
    { enabled },
  )
  useEffect(() => {
    if (!coverageQuery.data) return
    const raw = coverageQuery.data as Record<string, unknown>
    const categories =
      typeof raw.categories === 'string'
        ? JSON.parse(raw.categories as string)
        : raw.categories ?? []
    useTestingStore.getState().hydrateCoverage({
      overall: (raw.overall as number) ?? 0,
      categories,
    })
  }, [coverageQuery.data])

  /* ---------- Graphics assets ------------------------------------- */
  const graphicsQuery = trpc.graphics.list.useQuery(
    { productId: productId!, type: 'all' },
    { enabled },
  )
  useEffect(() => {
    if (!graphicsQuery.data) return
    useGraphicsStore.getState().hydrate(graphicsQuery.data as Record<string, unknown>[])
  }, [graphicsQuery.data])

  return {
    isLoading:
      codeQuery.isLoading ||
      handoffQuery.isLoading ||
      dashboardQuery.isLoading ||
      experimentsQuery.isLoading ||
      releaseQuery.isLoading ||
      suitesQuery.isLoading ||
      runsQuery.isLoading ||
      coverageQuery.isLoading ||
      graphicsQuery.isLoading,
    refetch: () => {
      codeQuery.refetch()
      handoffQuery.refetch()
      dashboardQuery.refetch()
      experimentsQuery.refetch()
      releaseQuery.refetch()
      suitesQuery.refetch()
      runsQuery.refetch()
      coverageQuery.refetch()
      graphicsQuery.refetch()
    },
  }
}
