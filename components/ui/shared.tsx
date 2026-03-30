"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold">{title}</h1>
        {sub && <p className="text-muted-foreground text-sm mt-1">{sub}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input placeholder={placeholder || "Search..."} className="pl-9" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

export function SkeletonRows({ count = 5, height = "h-12" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className={cn("animate-pulse bg-muted rounded-xl", height)} />
      ))}
    </div>
  )
}

export function StatusBadge({ status, colors }: { status: string; colors: Record<string, string> }) {
  return (
    <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", colors[status] || "bg-gray-100 text-gray-700")}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

export function SaveButton({ saving, label = "Save", editLabel }: { saving: boolean; label?: string; editLabel?: string }) {
  return (
    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editLabel || label}
    </Button>
  )
}
