import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT BRAND PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0f1117 0%, #1a1d23 50%, #0f1117 100%)" }}>

        {/* ── Grid overlay ── */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#ecc94b 1px, transparent 1px), linear-gradient(90deg, #ecc94b 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }} />

        {/* ── Glow orbs ── */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,201,75,0.12) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-60 right-0 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,201,75,0.03) 0%, transparent 60%)" }} />

        {/* ── Accent line top ── */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(236,201,75,0.5), transparent)" }} />

        {/* ── LOGO ── */}
        <div className="relative z-10 p-10 xl:p-12">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-md opacity-30 bg-black" />
              <img
                src="/images/Favicon_With_Background.jpg"
                alt="Veliora Logo"
                className="relative w-11 h-11 rounded-xl object-cover shadow-xl bg-black"
              />
            </div>
            <div>
              <p className="text-white font-heading font-bold text-xl leading-none tracking-tight">Veliora TechWorks CMS</p>
              <p className="text-[#ecc94b] text-xs font-semibold tracking-[0.15em] uppercase mt-0.5">Client Management System</p>
            </div>
          </div>
        </div>

        {/* ── CENTER CONTENT ── */}
        <div className="relative z-10 px-10 xl:px-12 space-y-10">

          {/* Headline */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ecc94b]/10 border border-[#ecc94b]/20 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ecc94b] animate-pulse" />
              <span className="text-[#ecc94b] text-xs font-semibold tracking-wide">All-in-one CRM Platform</span>
            </div>
            <h1 className="text-4xl xl:text-[2.75rem] font-heading font-bold text-white leading-[1.15] tracking-tight">
              Run your agency<br />
              <span className="relative">
                <span className="relative z-10 text-[#ecc94b]">smarter, not harder.</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#ecc94b]/10 rounded-sm -z-0" />
              </span>
            </h1>
            <p className="text-gray-400 mt-4 text-[0.9rem] leading-relaxed max-w-[360px]">
              Clients, leads, projects, payments — all in one place. Built for agencies that move fast.
            </p>
          </div>

          {/* Mock dashboard preview card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden shadow-2xl">
            {/* Card header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-gray-500 text-xs ml-2 font-mono">dashboard.veliora.app</span>
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-px bg-white/5 p-px">
              {[
                { label: "Revenue", value: "$48,200", up: true, color: "text-green-400" },
                { label: "Clients", value: "124", up: true, color: "text-[#ecc94b]" },
                { label: "Projects", value: "38", up: false, color: "text-blue-400" },
              ].map(k => (
                <div key={k.label} className="bg-[#0f1117] px-4 py-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">{k.label}</p>
                  <p className={`font-heading font-bold text-base mt-0.5 ${k.color}`}>{k.value}</p>
                  <p className={`text-[10px] mt-0.5 ${k.up ? "text-green-500" : "text-red-400"}`}>
                    {k.up ? "▲" : "▼"} {k.up ? "+12%" : "-3%"}
                  </p>
                </div>
              ))}
            </div>
            {/* Mini bar chart */}
            <div className="px-4 py-3 bg-[#0f1117]">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-2">Monthly Revenue</p>
              <div className="flex items-end gap-1.5 h-10">
                {[30, 55, 40, 70, 50, 85, 65, 90, 75, 95, 80, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: i === 11
                        ? "linear-gradient(180deg, #ecc94b, #d4a017)"
                        : `rgba(236,201,75,${0.15 + i * 0.02})`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              "Lead Kanban", "Invoice Generator", "Call Logs",
              "Auto Workflows", "Analytics", "CSV Export"
            ].map(tag => (
              <span key={tag}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-gray-400 font-medium hover:border-[#ecc94b]/30 hover:text-[#ecc94b] transition-colors cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── BOTTOM TRUST BAR ── */}
        <div className="relative z-10 px-10 xl:px-12 pb-10 xl:pb-12">
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="flex items-center justify-between">
            {/* Avatars + text */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#ecc94b", "#f97316", "#3b82f6", "#10b981"].map((c, i) => (
                  <div key={i}
                    className="w-7 h-7 rounded-full border-2 border-[#0f1117] flex items-center justify-center text-[10px] font-bold text-[#0f1117]"
                    style={{ background: c }}>
                    {["A", "T", "M", "S"][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Trusted by teams</p>
                <p className="text-gray-500 text-[11px]">Veliora TechWorks CMS © 2024</p>
              </div>
            </div>
            {/* Security badge */}
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5">
              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-400 text-[11px] font-semibold">Secure Login</span>
            </div>
          </div>
        </div>

        {/* ── Accent line bottom ── */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(236,201,75,0.3), transparent)" }} />
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0f1117] p-6 sm:p-10">
        {children}
      </div>
    </div>
  )
}
