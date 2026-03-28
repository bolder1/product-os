export default function LoginPage() {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center" style={{ boxShadow: '0 0 24px rgba(59,130,246,0.15)' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="8" r="3" fill="#3B82F6" />
            <circle cx="8" cy="22" r="3" fill="#8B5CF6" />
            <circle cx="24" cy="22" r="3" fill="#06B6D4" />
            <line x1="16" y1="11" x2="8" y2="19" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
            <line x1="16" y1="11" x2="24" y2="19" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
            <line x1="11" y1="22" x2="21" y2="22" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#F1F5F9]">Sign in to Product OS</h1>
        <p className="text-sm text-[#94A3B8]">Enter your credentials to continue</p>
      </div>
      <div className="w-full flex flex-col gap-3">
        <input type="email" placeholder="Email" className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 transition" />
        <input type="password" placeholder="Password" className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 transition" />
        <button className="w-full py-2.5 rounded-lg bg-[#3B82F6] text-white font-medium hover:bg-[#3B82F6]/90 transition">Sign In</button>
      </div>
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-xs text-[#64748B]">or</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>
      <div className="w-full flex flex-col gap-2">
        <button className="w-full py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#94A3B8] font-medium hover:bg-white/[0.04] transition">Continue with Google</button>
        <button className="w-full py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#94A3B8] font-medium hover:bg-white/[0.04] transition">Continue with GitHub</button>
      </div>
    </div>
  )
}
