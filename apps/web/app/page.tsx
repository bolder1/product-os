export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.04) 50%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6">
        {/* Logo mark */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.03]"
          style={{ boxShadow: '0 0 32px rgba(59,130,246,0.2)' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="8" r="3" fill="#3B82F6" />
            <circle cx="8" cy="22" r="3" fill="#8B5CF6" />
            <circle cx="24" cy="22" r="3" fill="#06B6D4" />
            <line x1="16" y1="11" x2="8" y2="19" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
            <line x1="16" y1="11" x2="24" y2="19" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
            <line x1="11" y1="22" x2="21" y2="22" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-semibold tracking-tight text-[#F1F5F9]">
            Product <span style={{ color: '#3B82F6' }}>OS</span>
          </h1>
          <p className="text-[#94A3B8] text-lg max-w-sm">
            Unified product intelligence and execution system
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/08 bg-white/[0.03] text-[#94A3B8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Server running
          </span>
          <span className="px-3 py-1 rounded-full border border-white/08 bg-white/[0.03] text-[#94A3B8]">
            Phase 0 — Foundation
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/08" />

        {/* Next steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
          {[
            { label: 'Auth', href: '/login', color: '#3B82F6', desc: 'Sign in / register' },
            { label: 'Planner', href: '#', color: '#8B5CF6', desc: 'Create your first product' },
            { label: 'Control Tower', href: '#', color: '#06B6D4', desc: 'Product health dashboard' },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl border border-white/08 bg-white/[0.02] flex flex-col gap-1"
            >
              <span className="text-xs font-medium" style={{ color: item.color }}>
                {item.label}
              </span>
              <span className="text-[#64748B] text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
