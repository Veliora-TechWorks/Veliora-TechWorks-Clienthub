"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  ArrowLeft, Plus, Loader2, Trash2, Pencil,
  ExternalLink, AlertTriangle, Calendar,
  MessageSquare, CheckCircle2,
} from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  PENDING:     "bg-yellow-100 text-yellow-800",
  COMPLETED:   "bg-green-100 text-green-800",
}
const STATUS_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding", IN_PROGRESS: "In Progress", PENDING: "Pending", COMPLETED: "Completed",
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW:    "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH:   "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
}
const TASK_STATUS_COLORS: Record<string, string> = {
  TODO:        "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  DONE:        "bg-green-100 text-green-800",
}
const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW:    "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH:   "bg-red-100 text-red-700",
}

function isOverdue(endDate: string | null | undefined, status: string): boolean {
  if (!endDate || status === "COMPLETED") return false
  return new Date(endDate) < new Date()
}

function daysRemaining(endDate: string | null | undefined): number | null {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const [project, setProject]     = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [taskOpen, setTaskOpen]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [editProgress, setEditProgress] = useState(false)
  const [progressVal, setProgressVal]   = useState(0)
  const [savingProgress, setSavingProgress] = useState(false)
  const [remarksOpen, setRemarksOpen] = useState(false)
  const [remarksText, setRemarksText] = useState("")
  const [savingRemarks, setSavingRemarks] = useState(false)

  const [taskStatus, setTaskStatus]     = useState("TODO")
  const [taskPriority, setTaskPriority] = useState("MEDIUM")

  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => {
    fetch(`/api/projects/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.error) {
          setProject(d)
          setProgressVal(d.progress ?? 0)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const openAddTask = () => {
    setEditingTask(null)
    setTaskStatus("TODO")
    setTaskPriority("MEDIUM")
    reset({ title: "", deadline: "", description: "" })
    setTaskOpen(true)
  }
  const openEditTask = (t: any) => {
    setEditingTask(t)
    setTaskStatus(t.status || "TODO")
    setTaskPriority(t.priority || "MEDIUM")
    reset({ title: t.title, deadline: t.deadline ? t.deadline.split("T")[0] : "", description: t.description || "" })
    setTaskOpen(true)
  }

  const onTaskSubmit = async (data: any) => {
    setSaving(true)
    const payload = { ...data, status: taskStatus, priority: taskPriority }
    if (editingTask) {
      await fetch(`/api/tasks/${editingTask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    } else {
      await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, projectId: id }) })
    }
    setSaving(false)
    toast({ title: editingTask ? "Task updated" : "Task added" })
    setTaskOpen(false)
    load()
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
    toast({ title: "Task deleted" })
    load()
  }

  const saveProgress = async () => {
    setSavingProgress(true)
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: progressVal }),
    })
    setSavingProgress(false)
    setEditProgress(false)
    toast({ title: "Progress updated" })
    load()
  }

  const saveRemarks = async () => {
    if (!remarksText.trim()) return
    setSavingRemarks(true)
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks: remarksText }),
    })
    setSavingRemarks(false)
    setRemarksOpen(false)
    setRemarksText("")
    toast({ title: "Remarks saved" })
    load()
  }

  if (loading) return (
    <div className="space-y-4">
      {Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse h-28 bg-muted rounded-2xl" />)}
    </div>
  )
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>

  const overdue = isOverdue(project.endDate, project.status)
  const days    = daysRemaining(project.endDate)
  const tasksDone = (project.tasks || []).filter((t: any) => t.status === "DONE").length

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl mt-0.5 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-heading font-bold truncate">{project.name}</h1>
            {overdue && (
              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-muted-foreground text-sm">
              <span className="font-mono text-xs">{project.projectId}</span>
              {project.client?.name && <> · {project.client.name}{project.client.company ? ` (${project.client.company})` : ""}</>}
            </p>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#ecc94b]/20 text-[#b7950b] hover:bg-[#ecc94b]/40 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> View Live
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PRIORITY_COLORS[project.priority]}`}>{project.priority}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[project.status]}`}>{STATUS_LABELS[project.status]}</span>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Progress card */}
        <Card className="border-0 shadow-sm sm:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setProgressVal(project.progress); setEditProgress(true) }}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </div>
            {editProgress ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="100" step="1"
                    value={progressVal}
                    onChange={e => setProgressVal(Number(e.target.value))}
                    className="flex-1 accent-[#ecc94b]"
                  />
                  <span className="text-2xl font-heading font-bold text-[#ecc94b] w-14 text-right">{progressVal}%</span>
                </div>
                <Progress value={progressVal} className="h-3" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveProgress} disabled={savingProgress} className="bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
                    {savingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditProgress(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Progress value={project.progress} className="flex-1 h-3" />
                <span className="text-2xl font-heading font-bold text-[#ecc94b]">{project.progress}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Timeline</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Start</span>
                <span className="font-medium text-xs">{project.startDate ? formatDate(project.startDate) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">End</span>
                <span className={`font-medium text-xs ${overdue ? "text-red-500" : ""}`}>{project.endDate ? formatDate(project.endDate) : "—"}</span>
              </div>
              {project.endDate && project.status !== "COMPLETED" && days !== null && (
                <div className={`text-xs font-semibold mt-1 ${overdue ? "text-red-500" : "text-green-600"}`}>
                  {overdue ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tasks summary */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Tasks</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{project.tasks?.length || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Done</span>
                <span className="font-semibold text-green-600">{tasksDone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold text-orange-500">{(project.tasks?.length || 0) - tasksDone}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tasks ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tasks ({project.tasks?.length || 0})</CardTitle>
            <Button size="sm" onClick={openAddTask} className="gap-1.5 h-8 bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!project.tasks?.length ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No tasks yet. Add your first task.</p>
          ) : (
            <div className="space-y-2">
              {project.tasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                    {task.deadline && <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(task.deadline)}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TASK_PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TASK_STATUS_COLORS[task.status]}`}>{task.status.replace("_", " ")}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditTask(task)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500" onClick={() => deleteTask(task.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Remarks ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Remarks & Notes</CardTitle>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => { setRemarksText(project.remarks || ""); setRemarksOpen(true) }}>
              <Pencil className="w-3.5 h-3.5" /> {project.remarks ? "Update" : "Add Remark"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {project.remarks ? (
            <p className="text-sm text-foreground bg-muted/40 rounded-xl p-3 leading-relaxed">{project.remarks}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No remarks added yet.</p>
          )}

          {/* Remarks history */}
          {project.remarksHistory?.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">History</p>
              {[...project.remarksHistory].reverse().map((r: any, i: number) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ecc94b] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-snug">{r.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.updatedBy} · {r.updatedAt ? formatDateTime(r.updatedAt) : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Task modal ── */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-w-md p-0 gap-0">

          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">
              {editingTask ? "Edit Task" : "New Task"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {editingTask ? "Update task details below" : "Add a new task to this project"}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onTaskSubmit)}>
            <div className="px-6 py-5 space-y-5">

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Task Title <span className="text-red-500">*</span></Label>
                <Input
                  {...register("title", { required: true })}
                  placeholder="e.g. Design homepage mockup"
                  className="h-10"
                />
              </div>

              {/* Priority pills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "LOW",    label: "Low",    dot: "bg-gray-400",   active: "bg-gray-100 text-gray-700 ring-2 ring-gray-400 border-transparent" },
                    { value: "MEDIUM", label: "Medium", dot: "bg-yellow-400", active: "bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent" },
                    { value: "HIGH",   label: "High",   dot: "bg-red-500",    active: "bg-red-50 text-red-700 ring-2 ring-red-400 border-transparent" },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTaskPriority(opt.value)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        taskPriority === opt.value ? opt.active : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status pills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "TODO",        label: "To Do",      active: "bg-gray-100 text-gray-700 ring-2 ring-gray-400 border-transparent" },
                    { value: "IN_PROGRESS", label: "In Progress", active: "bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent" },
                    { value: "DONE",        label: "Done",        active: "bg-green-50 text-green-700 ring-2 ring-green-400 border-transparent" },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTaskStatus(opt.value)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                        taskStatus === opt.value ? opt.active : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Deadline</Label>
                <Input {...register("deadline")} type="date" className="h-10" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  {...register("description")}
                  placeholder="Optional task details or notes…"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setTaskOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editingTask ? "Update Task" : "Add Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Remarks modal ── */}
      <Dialog open={remarksOpen} onOpenChange={setRemarksOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update Remarks</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={remarksText}
              onChange={e => setRemarksText(e.target.value)}
              placeholder="Add notes or updates about this project…"
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarksOpen(false)}>Cancel</Button>
            <Button onClick={saveRemarks} disabled={savingRemarks || !remarksText.trim()} className="bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
              {savingRemarks ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Remarks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
