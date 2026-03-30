import { router } from './trpc'
import { graphRouter } from './routers/graph'
import { productRouter } from './routers/product'
import { taskRouter } from './routers/task'
import { approvalRouter } from './routers/approval'
import { notificationRouter } from './routers/notification'
import { commentRouter } from './routers/comment'
import { templateRouter } from './routers/template'
import { aiRouter } from './routers/ai'
import { plannerRouter } from './routers/planner'

export const appRouter = router({
  graph: graphRouter,
  product: productRouter,
  task: taskRouter,
  approval: approvalRouter,
  notification: notificationRouter,
  comment: commentRouter,
  template: templateRouter,
  ai: aiRouter,
  planner: plannerRouter,
})

export type AppRouter = typeof appRouter
