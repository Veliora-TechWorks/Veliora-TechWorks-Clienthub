"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react"

const statusColors: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-gray-100 text-gray-700",
  COMPLETED: "bg-green-100 text-green-800",
}

const schema = z.object({
  name: z.string().min(1, "Name required"),
  clientId: z.string().min(1, "Client required"),
  status: z.string().default("ONBOARDING"),
  progress: z.coerce.number().min(0).max(100).default(0),
  deadline: z.string().optional(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const load = () => {
    setLoading(true)
    Promise.all([fetch("/api/projects").then(r => r.json()), fetch("/api/clients").then(r => r.json())])
      .then(([p, c]) => { setProjects(p); setClients(c); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); reset({ status: "ONBOARDING", progress: 0 }); setOpen(true) }
  const openEdit = (p: any) => {
    setEditing(p)
    reset({ name: p.name, clientId: p.clientId, status: p.status, progress: p.progress, deadline: p.deadline ? p.deadline.split("T")[0] : "", description: p.description || "" })
    setOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const url = editing ? `/api/projects/${editing.id}` : "/api/projects"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    setSaving(false)
    if (res.ok) { toast({ title: editing ? "Project updated" : "Project created" }); setOpen(false); load() }
  }

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    toast({ title: "Project deleted" })
    load()
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.name || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} total projects</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-16 bg-muted rounded-xl" />)}</div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No projects found</p>
                ) : filtered.map(p => (
                  <div key={p.id} className="p-3 rounded-xl border border-border bg-background space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.client?.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[p.status]}`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="flex-1 h-1.5" />
                      <span className="text-xs text-muted-foreground w-8 shrink-0">{p.progress}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{p.deadline ? formatDate(p.deadline) : "No deadline"}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => router.push(`/projects/${p.id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500" onClick={() => deleteProject(p.id, p.name)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No projects found</TableCell></TableRow>
                    ) : filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.client?.name}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[p.status]}`}>{p.status.replace("_", " ")}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={p.progress} className="flex-1 h-1.5" />
                            <span className="text-xs text-muted-foreground w-8">{p.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{p.tasks?.length || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.deadline ? formatDate(p.deadline) : "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => router.push(`/projects/${p.id}`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(p)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600" onClick={() => deleteProject(p.id, p.name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Project Name *</Label>
              <Input {...register("name")} placeholder="E-Commerce Platform" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select defaultValue={editing?.clientId} onValueChange={v => setValue("clientId", v)}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-xs text-red-500">{errors.clientId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select defaultValue={editing?.status || "ONBOARDING"} onValueChange={v => setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Progress (%)</Label>
                <Input {...register("progress")} type="number" min="0" max="100" placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input {...register("deadline")} type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...register("description")} placeholder="Brief project description" />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
