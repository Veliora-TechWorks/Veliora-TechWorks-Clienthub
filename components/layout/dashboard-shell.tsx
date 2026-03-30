"use client"
import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

interface DashboardShellProps {
  user: { name: string; email: string; role: string }
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-[#f8f9fa] dark:bg-[#0f1117] overflow-hidden">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(v => !v)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
