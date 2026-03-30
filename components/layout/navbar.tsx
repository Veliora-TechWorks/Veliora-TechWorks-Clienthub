"use client"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Bell, Sun, Moon, LogOut, Settings, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/utils"
import Link from "next/link"

function useNotifications() {
  const [items, setItems] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await window.fetch("/api/activity")
      if (!res.ok) return
      const data = await res.json()
      setItems(data.slice(0, 8))
      setUnread(data.slice(0, 8).length)
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  const onOpen = (val: boolean) => {
    setOpen(val)
    if (val) setUnread(0)
  }

  const clear = () => setItems([])

  return { items, unread, open, onOpen, clear }
}

function timeAgo(ts: any) {
  if (!ts) return ""
  const date = ts?.toDate ? ts.toDate() : new Date(ts._seconds ? ts._seconds * 1000 : ts)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/leads": "Leads",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/calls": "Call Logs",
  "/payments": "Payments",
  "/analytics": "Analytics",
  "/automation": "Automation",
  "/settings": "Settings",
}

interface NavbarProps {
  user: { name: string; email: string; role: string }
  onMenuClick: () => void
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const title = Object.entries(pageTitles).find(([k]) => pathname === k || (k !== "/dashboard" && pathname.startsWith(k)))?.[1] || "Dashboard"
  const { items, unread, open, onOpen, clear } = useNotifications()

  return (
    <header className="h-14 md:h-16 bg-white dark:bg-[#1a1d23] border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Logo on mobile next to hamburger */}
        <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-black">
            <Image
              src="/images/Favicon_With_Background.jpg"
              alt="Veliora"
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-heading font-bold">Veliora TechWorks CMS</span>
        </Link>
        <p className="text-sm font-medium text-muted-foreground hidden lg:block">
          Welcome back, <span className="text-foreground font-semibold">{user.name}</span>
        </p>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl w-9 h-9"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <DropdownMenu open={open} onOpenChange={onOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9 relative">
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f97316] rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <div className="flex items-center gap-2">
                {unread > 0 && <span className="text-xs bg-[#f97316] text-white rounded-full px-1.5 py-0.5">{unread}</span>}
                {items.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clear() }}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors font-normal"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No recent activity</div>
            ) : (
              items.map((item) => (
                <DropdownMenuItem key={item.id} className="flex flex-col items-start gap-0.5 py-2.5 cursor-default">
                  <span className="text-sm font-medium leading-snug">
                    {item.action} {item.entity}
                    {item.details ? ` — ${item.details}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.user?.name ?? "System"} · {timeAgo(item.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-xl px-2 h-9">
              <Avatar className="w-7 h-7 md:w-8 md:h-8">
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
