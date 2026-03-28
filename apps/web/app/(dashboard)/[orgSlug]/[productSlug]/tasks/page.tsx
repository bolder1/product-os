export default function TasksPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
        <span className="text-[#3B82F6] text-2xl">T</span>
      </div>
      <h1 className="text-xl font-semibold text-[#F1F5F9]">Tasks</h1>
      <p className="text-[#94A3B8] text-sm">Manage work items</p>
    </div>
  )
}
