"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react"

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
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => {
    setLoading(true)
    Promise.all([fetch("/api/tasks").then(r => r.json()), fetch("/api/projects").then(r => r.json())])
      .then(([t, p]) => { setTasks(t); setProjects(p); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); reset({ status: "TODO", priority: "MEDIUM" }); setOpen(true) }
  const openEdit = (t: any) => {
    setEditing(t)
    reset({ title: t.title, projectId: t.projectId, status: t.status, priority: t.priority, deadline: t.deadline ? t.deadline.split("T")[0] : "" })
    setOpen(true)
  }

  const onSubmit = async (data: any) => {
    setSaving(true)
    const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks"
    const method = editing ? "PATCH" : "POST"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
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

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.project?.name || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">{tasks.length} total tasks</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                    <p className="text-xs text-muted-foreground mb-2">{t.project?.name || "—"}</p>
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
                        <TableCell className="text-sm text-muted-foreground">{t.project?.name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.project?.client?.name || "—"}</TableCell>
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
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>{editing ? "Edit Task" : "Add Task"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...register("title", { required: true })} placeholder="Task title" />
            </div>
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select defaultValue={editing?.projectId} onValueChange={v => setValue("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select defaultValue={editing?.status || "TODO"} onValueChange={v => setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select defaultValue={editing?.priority || "MEDIUM"} onValueChange={v => setValue("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input {...register("deadline")} type="date" />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
