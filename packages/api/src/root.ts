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
})

export type AppRouter = typeof appRouter
