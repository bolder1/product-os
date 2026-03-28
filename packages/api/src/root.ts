import { router } from './trpc.js'
import { graphRouter } from './routers/graph.js'
import { productRouter } from './routers/product.js'
import { taskRouter } from './routers/task.js'
import { approvalRouter } from './routers/approval.js'
import { notificationRouter } from './routers/notification.js'
import { commentRouter } from './routers/comment.js'
import { templateRouter } from './routers/template.js'
import { aiRouter } from './routers/ai.js'
import { plannerRouter } from './routers/planner.js'

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
