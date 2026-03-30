"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, UserPlus, FolderKanban, CheckSquare,
  Phone, CreditCard, BarChart3, Settings, Bot, X,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients",   label: "Clients",   icon: Users },
  { href: "/leads",     label: "Leads",     icon: UserPlus },
  { href: "/projects",  label: "Projects",  icon: FolderKanban },
  { href: "/tasks",     label: "Tasks",     icon: CheckSquare },
  { href: "/calls",     label: "Call Logs", icon: Phone },
  { href: "/payments",  label: "Payments",  icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/automation",label: "Automation",icon: Bot },
  { href: "/settings",  label: "Settings",  icon: Settings },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

function SidebarContent({
  collapsed,
  isMobile,
  pathname,
  onMobileClose,
  onToggleCollapse,
}: {
  collapsed: boolean
  isMobile: boolean
  pathname: string
  onMobileClose: () => void
  onToggleCollapse: () => void
}) {
  const isCollapsed = collapsed && !isMobile

  return (
    <aside
      className={cn(
        "bg-[#1c1f26] flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out border-r border-white/[0.06]",
        isMobile ? "w-64" : isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* ── HEADER ── */}
      <div className="h-16 shrink-0 border-b border-white/[0.06] flex items-center justify-between px-4">
        {/* Logo + name */}
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className={cn("flex items-center gap-3 min-w-0 overflow-hidden", isCollapsed && "w-0 opacity-0 pointer-events-none")}
          style={{ transition: "width 0.3s, opacity 0.2s" }}
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black shadow-md">
            <Image
              src="/images/Favicon_With_Background.jpg"
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-heading font-bold text-[11px] leading-tight truncate">
              Veliora TechWorks CMS
            </p>
            <p className="text-[#ecc94b] text-[9px] font-medium tracking-wide truncate">
              Client Management System
            </p>
          </div>
        </Link>

        {/* Collapsed: centered logo */}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black shadow-md">
              <Image
                src="/images/Favicon_With_Background.jpg"
                alt="Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        )}

        {/* Mobile close */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Desktop collapse toggle (expanded state) */}
        {!isMobile && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── NAV ── */}
      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-3", isCollapsed ? "px-2" : "px-3")}>
        {/* Section label */}
        {!isCollapsed && (
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">
            Menu
          </p>
        )}
        {isCollapsed && <div className="mb-2 h-px bg-white/[0.06] mx-1" />}

        <div className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            return (
              <div key={href} className="relative group">
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-medium transition-all duration-150",
                    isCollapsed
                      ? "justify-center p-2.5 mx-auto"
                      : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-[#ecc94b] text-[#1c1f26] shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.07]"
                  )}
                >
                  <Icon className={cn("shrink-0", isCollapsed ? "w-[18px] h-[18px]" : "w-4 h-4")} />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                  {/* Active dot indicator in collapsed */}
                  {isCollapsed && active && (
                    <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-[#ecc94b]" />
                  )}
                </Link>

                {/* Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#0f1117] border border-white/10 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                      {label}
                      {/* Arrow */}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#0f1117]" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── FOOTER ── */}
      <div className={cn("border-t border-white/[0.06] shrink-0", isCollapsed ? "p-3" : "p-4")}>
        {isCollapsed ? (
          /* Collapsed footer: just the expand button */
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.07] transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-[18px] h-[18px]" />
          </button>
        ) : (
          <p className="text-[10px] text-gray-600 text-center">
            Veliora TechWorks CMS © 2024
          </p>
        )}
      </div>
    </aside>
  )
}

export function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-full">
        <SidebarContent
          collapsed={collapsed}
          isMobile={false}
          pathname={pathname}
          onMobileClose={onMobileClose}
          onToggleCollapse={onToggleCollapse}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative z-10 h-full">
            <SidebarContent
              collapsed={false}
              isMobile={true}
              pathname={pathname}
              onMobileClose={onMobileClose}
              onToggleCollapse={onToggleCollapse}
            />
          </div>
        </div>
      )}
    </>
  )
}
