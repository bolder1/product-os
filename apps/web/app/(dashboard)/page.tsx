export default function DashboardHome() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#F1F5F9]">Welcome to Product OS</h1>
        <p className="text-[#94A3B8] mt-1">Select or create a product to get started.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="#" className="group p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-200">
          <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center mb-3">
            <span className="text-[#3B82F6] text-lg">+</span>
          </div>
          <h3 className="font-medium text-[#F1F5F9]">New Product</h3>
          <p className="text-sm text-[#64748B] mt-1">Start from scratch or use a template</p>
        </a>
      </div>
    </div>
  )
}
