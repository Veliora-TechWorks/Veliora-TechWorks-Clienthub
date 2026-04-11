"use client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Filter, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, Link2 } from "lucide-react"

// ── Colour maps ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  PENDING:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
}
const STATUS_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding", IN_PROGRESS: "In Progress", PENDING: "Pending", COMPLETED: "Completed",
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  HIGH:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
}

// ── Zod schema ───────────────────────────────────────────────────────────────
const schema = z.object({
  name:      z.string().min(1, "Project name is required"),
  clientId:  z.string().optional(),
  link:      z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate:   z.string().min(1, "End date is required"),
  priority:  z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status:    z.enum(["ONBOARDING", "IN_PROGRESS", "PENDING", "COMPLETED"]),
  progress:  z.coerce.number().min(0).max(100),
  remarks:   z.string().optional(),
})
type FormData = z.infer<typeof schema>

function progressToStatus(p: number): FormData["status"] {
  if (p <= 20) return "ONBOARDING"
  if (p <= 80) return "IN_PROGRESS"
  if (p < 100) return "PENDING"
  return "COMPLETED"
}

function isOverdue(endDate: string | null | undefined): boolean {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

function daysRemaining(endDate: string | null | undefined): number | null {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const PAGE_SIZE = 10

// ── Component ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [filterStatus, setFilterStatus]     = useState("ALL")
  const [filterPriority, setFilterPriority] = useState("ALL")
  const [page, setPage]   = useState(1)
  const [open, setOpen]   = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM", status: "ONBOARDING", progress: 0 },
  })

  const progressVal = watch("progress")

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/clients").then(r => r.json()),
    ]).then(([p, c]) => {
      const seen = new Set<string>()
      const unique = (Array.isArray(p) ? p : []).filter((x: any) => { if (seen.has(x.id)) return false; seen.add(x.id); return true })
      setProjects(unique)
      setClients(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  // Auto-sync status when progress changes in form
  useEffect(() => {
    if (!editing) setValue("status", progressToStatus(Number(progressVal) || 0))
  }, [progressVal])

  const openAdd = () => {
    setEditing(null)
    reset({ priority: "MEDIUM", status: "ONBOARDING", progress: 0, name: "", clientId: "", link: "", startDate: "", endDate: "", remarks: "" })
    setOpen(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    reset({
      name:      p.name,
      clientId:  p.clientId,
      link:      p.link || "",
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      endDate:   p.endDate   ? p.endDate.split("T")[0]   : "",
      priority:  p.priority  || "MEDIUM",
      status:    p.status    || "ONBOARDING",
      progress:  p.progress  ?? 0,
      remarks:   p.remarks   || "",
    })
    setOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const url    = editing ? `/api/projects/${editing.id}` : "/api/projects"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    setSaving(false)
    if (res.ok) {
      toast({ title: editing ? "Project updated" : "Project created" })
      setOpen(false)
      load()
    } else {
      toast({ title: "Something went wrong", variant: "destructive" })
    }
  }

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    setDeleting(null)
    toast({ title: "Project deleted" })
    load()
  }

  // ── Filtering & pagination ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return projects.filter(p => {
      const matchSearch   = p.name.toLowerCase().includes(q) || (p.client?.name || "").toLowerCase().includes(q) || (p.projectId || "").toLowerCase().includes(q)
      const matchStatus   = filterStatus   === "ALL" || p.status   === filterStatus
      const matchPriority = filterPriority === "ALL" || p.priority === filterPriority
      return matchSearch && matchStatus && matchPriority
    })
  }, [projects, search, filterStatus, filterPriority])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filterStatus, filterPriority])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     projects.length,
    active:    projects.filter(p => p.status === "IN_PROGRESS").length,
    completed: projects.filter(p => p.status === "COMPLETED").length,
    overdue:   projects.filter(p => p.status !== "COMPLETED" && isOverdue(p.endDate)).length,
  }), [projects])

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{stats.total} total · {stats.active} active · {stats.completed} completed{stats.overdue > 0 ? ` · ${stats.overdue} overdue` : ""}</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2 self-start sm:self-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total",     value: stats.total,     color: "text-foreground" },
          { label: "Active",    value: stats.active,    color: "text-orange-500" },
          { label: "Completed", value: stats.completed, color: "text-green-500" },
          { label: "Overdue",   value: stats.overdue,   color: "text-red-500" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-heading font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table card ── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, client, or ID…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px] gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="animate-pulse h-14 bg-muted rounded-xl" />)}</div>
          ) : (
            <>
              {/* ── Mobile cards ── */}
              <div className="md:hidden space-y-3">
                {paginated.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No projects found</p>
                ) : paginated.map(p => {
                  const days = daysRemaining(p.endDate)
                  const overdue = p.status !== "COMPLETED" && isOverdue(p.endDate)
                  return (
                    <div key={p.id} className={`p-3 rounded-xl border bg-background space-y-2.5 ${overdue ? "border-red-300 dark:border-red-800" : "border-border"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate">{p.name}</p>
                            {overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{p.projectId} · {p.client?.name}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-8 shrink-0 text-right">{p.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {p.endDate ? (overdue ? <span className="text-red-500 font-medium">Overdue by {Math.abs(days!)}d</span> : `${days}d left`) : "No deadline"}
                        </p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => router.push(`/projects/${p.id}`)}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500" onClick={() => deleteProject(p.id, p.name)} disabled={deleting === p.id}>
                            {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Desktop table ── */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="min-w-[140px]">Progress</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-16">No projects found</TableCell></TableRow>
                    ) : paginated.map(p => {
                      const days    = daysRemaining(p.endDate)
                      const overdue = p.status !== "COMPLETED" && isOverdue(p.endDate)
                      return (
                        <TableRow key={p.id} className={overdue ? "bg-red-50/40 dark:bg-red-950/20" : ""}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{p.projectId || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm">{p.name}</span>
                              {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" /></a>}
                              {overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            {p.client ? (
                              <button onClick={() => router.push(`/clients/${p.clientId || p.client?.id}`)} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                                {p.client.name}
                              </button>
                            ) : <span className="text-sm text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={p.progress} className="w-24 h-2" />
                              <span className="text-xs font-medium text-muted-foreground w-8">{p.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.startDate ? formatDate(p.startDate) : "—"}</TableCell>
                          <TableCell>
                            {p.endDate ? (
                              <div>
                                <p className={`text-sm ${overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>{formatDate(p.endDate)}</p>
                                {p.status !== "COMPLETED" && days !== null && (
                                  <p className={`text-[10px] ${overdue ? "text-red-400" : "text-muted-foreground"}`}>
                                    {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                                  </p>
                                )}
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => router.push(`/projects/${p.id}`)}><Eye className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600" onClick={() => deleteProject(p.id, p.name)} disabled={deleting === p.id}>
                                {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <Button key={n} variant={n === page ? "default" : "outline"} size="icon" className="w-8 h-8 text-xs" onClick={() => setPage(n)}>{n}</Button>
                    ))}
                    <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0">

          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-lg font-heading font-bold">
              {editing ? "Edit Project" : "New Project"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {editing ? <span className="font-mono">{editing.projectId}</span> : "Fill in the details to create a new project"}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">

              {/* ── Row 1: Project Name ── */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></Label>
                <Input
                  {...register("name")}
                  placeholder="e.g. E-Commerce Platform Redesign"
                  className="h-10"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* ── Row 2: Client + Project URL ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Client</Label>
                  <Select
                    key={editing?.clientId ?? "new"}
                    defaultValue={editing?.clientId}
                    onValueChange={v => setValue("clientId", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a client…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-medium">{c.name}</span>
                          {c.company && <span className="text-muted-foreground"> · {c.company}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" /> Project URL
                  </Label>
                  <Input
                    {...register("link")}
                    placeholder="https://example.com"
                    type="url"
                    className="h-10"
                  />
                  {errors.link && <p className="text-xs text-red-500">{errors.link.message}</p>}
                </div>
              </div>

              {/* ── Row 3: Start Date + End Date ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Start Date <span className="text-red-500">*</span></Label>
                  <Input {...register("startDate")} type="date" className="h-10" />
                  {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">End Date <span className="text-red-500">*</span></Label>
                  <Input {...register("endDate")} type="date" className="h-10" />
                  {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
                </div>
              </div>

              {/* ── Row 4: Priority ── */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { value: "LOW",    label: "Low",    dot: "bg-gray-400",   active: "bg-gray-100 text-gray-700 ring-2 ring-gray-400 border-transparent" },
                    { value: "MEDIUM", label: "Medium", dot: "bg-yellow-400", active: "bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent" },
                    { value: "HIGH",   label: "High",   dot: "bg-orange-400", active: "bg-orange-50 text-orange-700 ring-2 ring-orange-400 border-transparent" },
                    { value: "URGENT", label: "Urgent", dot: "bg-red-500",    active: "bg-red-50 text-red-700 ring-2 ring-red-400 border-transparent" },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("priority", opt.value, { shouldValidate: true })}
                      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        watch("priority") === opt.value ? opt.active : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Row 5: Status ── */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { value: "ONBOARDING",  label: "Onboarding",  active: "bg-blue-50 text-blue-700 ring-2 ring-blue-400 border-transparent" },
                    { value: "IN_PROGRESS", label: "In Progress",  active: "bg-orange-50 text-orange-700 ring-2 ring-orange-400 border-transparent" },
                    { value: "PENDING",     label: "Pending",      active: "bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent" },
                    { value: "COMPLETED",   label: "Completed",    active: "bg-green-50 text-green-700 ring-2 ring-green-400 border-transparent" },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("status", opt.value, { shouldValidate: true })}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                        watch("status") === opt.value ? opt.active : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Row 6: Progress slider ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Progress</Label>
                  <span className="text-sm font-bold tabular-nums text-[#ecc94b]">{progressVal ?? 0}%</span>
                </div>
                <input
                  {...register("progress")}
                  type="range" min="0" max="100" step="1"
                  className="w-full cursor-pointer accent-[#ecc94b]"
                />
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-200"
                    style={{ width: `${progressVal ?? 0}%`, background: "linear-gradient(90deg,#ecc94b,#f97316)" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>

              {/* ── Row 7: Remarks ── */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Remarks / Notes</Label>
                <Textarea
                  {...register("remarks")}
                  placeholder="Add any notes or updates about this project…"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editing ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
