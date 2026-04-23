import { router } from './trpc'
import { authRouter } from './routers/auth'
import { graphRouter } from './routers/graph'
import { productRouter } from './routers/product'
import { taskRouter } from './routers/task'
import { approvalRouter } from './routers/approval'
import { notificationRouter } from './routers/notification'
import { commentRouter } from './routers/comment'
import { templateRouter } from './routers/template'
import { aiRouter } from './routers/ai'
import { plannerRouter } from './routers/planner'
import { activityRouter } from './routers/activity'
import { versionRouter } from './routers/version'
import { connectorRouter } from './routers/connector'
import { memberRouter } from './routers/member'
import { componentRouter } from './routers/component'
import { designRouter } from './routers/design'
import { pageRouter } from './routers/page'
import { workflowRouter } from './routers/workflow'
import { codeRouter } from './routers/code'
import { handoffRouter } from './routers/handoff'
import { analyticsRouter } from './routers/analytics'
import { releaseRouter } from './routers/release'
import { testingRouter } from './routers/testing'
import { graphicsRouter } from './routers/graphics'
import { controlTowerRouter } from './routers/control-tower'
import { opsPilotRouter } from './routers/ops-pilot'
import { memoryRouter } from './routers/memory'
import { planModeRouter } from './routers/plan-mode'
import { graphSnapshotRouter } from './routers/graph-snapshot'

export const appRouter = router({
  auth: authRouter,
  graph: graphRouter,
  product: productRouter,
  task: taskRouter,
  approval: approvalRouter,
  notification: notificationRouter,
  comment: commentRouter,
  template: templateRouter,
  ai: aiRouter,
  planner: plannerRouter,
  activity: activityRouter,
  version: versionRouter,
  connector: connectorRouter,
  member: memberRouter,
  component: componentRouter,
  design: designRouter,
  page: pageRouter,
  workflow: workflowRouter,
  code: codeRouter,
  handoff: handoffRouter,
  analytics: analyticsRouter,
  release: releaseRouter,
  testing: testingRouter,
  graphics: graphicsRouter,
  controlTower: controlTowerRouter,
  opsPilot: opsPilotRouter,
  memory: memoryRouter,
  planMode: planModeRouter,
  graphSnapshot: graphSnapshotRouter,
})

export type AppRouter = typeof appRouter
