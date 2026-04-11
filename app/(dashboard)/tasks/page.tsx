"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react"

const statusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  DONE: "bg-green-100 text-green-800",
}
const priorityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterClient, setFilterClient] = useState("ALL")
  const [filterProject, setFilterProject] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [taskStatus, setTaskStatus] = useState("TODO")
  const [taskPriority, setTaskPriority] = useState("MEDIUM")
  const [selectedClientId, setSelectedClientId] = useState("")

  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/clients").then(r => r.json()),
    ]).then(([t, p, c]) => {
      setTasks(Array.isArray(t) ? t : [])
      setProjects(Array.isArray(p) ? p : [])
      setClients(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const filteredProjects = selectedClientId
    ? projects.filter(p => p.clientId === selectedClientId || p.client?.id === selectedClientId)
    : projects

  const openAdd = () => {
    setEditing(null)
    setTaskStatus("TODO")
    setTaskPriority("MEDIUM")
    setSelectedClientId("")
    reset({ title: "", projectId: "", deadline: "" })
    setOpen(true)
  }
  const openEdit = (t: any) => {
    setEditing(t)
    setTaskStatus(t.status || "TODO")
    setTaskPriority(t.priority || "MEDIUM")
    const proj = projects.find(p => p.id === t.projectId)
    setSelectedClientId(proj?.clientId || proj?.client?.id || "")
    reset({ title: t.title, projectId: t.projectId, deadline: t.deadline ? t.deadline.split("T")[0] : "" })
    setOpen(true)
  }

  const onSubmit = async (data: any) => {
    setSaving(true)
    const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks"
    const method = editing ? "PATCH" : "POST"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, status: taskStatus, priority: taskPriority }) })
    setSaving(false)
    toast({ title: editing ? "Task updated" : "Task created" })
    setOpen(false)
    load()
  }

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    toast({ title: "Task deleted" })
    load()
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.project?.name || "").toLowerCase().includes(search.toLowerCase())
    const matchClient = filterClient === "ALL" || filterClient === "__personal__"
      ? filterClient === "ALL" || !t.project?.client?.name
      : (t.project?.client?.name && clients.find(c => c.id === filterClient)?.name === t.project.client.name)
    const matchProject = filterProject === "ALL" || t.projectId === filterProject
    return matchSearch && matchClient && matchProject
  })

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">{tasks.length} total tasks</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2 self-start sm:self-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterClient} onValueChange={v => { setFilterClient(v); setFilterProject("ALL") }}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Clients" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Clients</SelectItem>
                <SelectItem value="__personal__">— Personal / No Client</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Projects</SelectItem>
                {(filterClient === "ALL" ? projects : projects.filter(p => p.clientId === filterClient || p.client?.id === filterClient))
                  .map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="animate-pulse h-12 bg-muted rounded-xl" />)}</div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No tasks found</p>
                ) : filtered.map(t => (
                  <div key={t.id} className="p-3 rounded-xl border border-border bg-background">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className={`font-medium text-sm flex-1 ${t.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500" onClick={() => deleteTask(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <p className="text-xs text-muted-foreground">{t.project?.name || "—"}</p>
                      {t.projectId && (
                        <button onClick={() => router.push(`/projects/${t.projectId}`)} className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {t.project?.client?.name && (
                      <p className="text-xs text-muted-foreground mb-2">{t.project.client.name}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>{t.status.replace("_", " ")}</span>
                      {t.deadline && <span className="text-xs text-muted-foreground">{formatDate(t.deadline)}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No tasks found</TableCell></TableRow>
                    ) : filtered.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className={`font-medium text-sm ${t.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{t.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-muted-foreground">{t.project?.name || "—"}</span>
                            {t.projectId && (
                              <button onClick={() => router.push(`/projects/${t.projectId}`)} className="text-muted-foreground hover:text-foreground">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.project?.client?.name ? (
                            <button
                              onClick={() => {
                                const client = clients.find(c => c.name === t.project.client.name)
                                if (client) router.push(`/clients/${client.id}`)
                              }}
                              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                            >
                              {t.project.client.name}
                            </button>
                          ) : "—"}
                        </TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority]}`}>{t.priority}</span></TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>{t.status.replace("_", " ")}</span></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.deadline ? formatDate(t.deadline) : "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => deleteTask(t.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">{editing ? "Edit Task" : "New Task"}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editing ? "Update task details" : "Create a new task"}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Task Title <span className="text-red-500">*</span></Label>
                <Input {...register("title", { required: true })} placeholder="e.g. Design homepage mockup" className="h-10" />
              </div>

              {/* Client → Project cascade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Client</Label>
                  <Select value={selectedClientId} onValueChange={v => { setSelectedClientId(v === "__personal__" ? "" : v); setValue("projectId", "") }}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Filter by client…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__personal__">— Personal / No Client</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Project</Label>
                  <Select key={editing?.projectId ?? "new"} defaultValue={editing?.projectId} onValueChange={v => setValue("projectId", v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select project…" /></SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Priority pills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([{v:"LOW",l:"Low",dot:"bg-gray-400",a:"bg-gray-100 text-gray-700 ring-2 ring-gray-400 border-transparent"},{v:"MEDIUM",l:"Medium",dot:"bg-yellow-400",a:"bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent"},{v:"HIGH",l:"High",dot:"bg-red-500",a:"bg-red-50 text-red-700 ring-2 ring-red-400 border-transparent"}]).map(opt => (
                    <button key={opt.v} type="button" onClick={() => setTaskPriority(opt.v)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        taskPriority === opt.v ? opt.a : "border-border text-muted-foreground hover:bg-muted"
                      }`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />{opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status pills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([{v:"TODO",l:"To Do",a:"bg-gray-100 text-gray-700 ring-2 ring-gray-400 border-transparent"},{v:"IN_PROGRESS",l:"In Progress",a:"bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent"},{v:"DONE",l:"Done",a:"bg-green-50 text-green-700 ring-2 ring-green-400 border-transparent"}]).map(opt => (
                    <button key={opt.v} type="button" onClick={() => setTaskStatus(opt.v)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                        taskStatus === opt.v ? opt.a : "border-border text-muted-foreground hover:bg-muted"
                      }`}>{opt.l}</button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Deadline */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Deadline</Label>
                <Input {...register("deadline")} type="date" className="h-10" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editing ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
