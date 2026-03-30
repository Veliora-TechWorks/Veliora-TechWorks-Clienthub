"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ArrowLeft, Plus, CheckCircle2, Circle, Loader2, Trash2, Pencil } from "lucide-react"

const taskStatusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  DONE: "bg-green-100 text-green-800",
}
const priorityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [taskOpen, setTaskOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { setProject(d); setLoading(false) })
  }
  useEffect(() => { load() }, [id])

  const openAddTask = () => { setEditingTask(null); reset({ status: "TODO", priority: "MEDIUM" }); setTaskOpen(true) }
  const openEditTask = (t: any) => {
    setEditingTask(t)
    reset({ title: t.title, status: t.status, priority: t.priority, deadline: t.deadline ? t.deadline.split("T")[0] : "" })
    setTaskOpen(true)
  }

  const onTaskSubmit = async (data: any) => {
    setSaving(true)
    if (editingTask) {
      await fetch(`/api/tasks/${editingTask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    } else {
      await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, projectId: id }) })
    }
    setSaving(false)
    toast({ title: editingTask ? "Task updated" : "Task added" })
    setTaskOpen(false)
    load()
  }

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
    toast({ title: "Task deleted" })
    load()
  }

  const updateOnboarding = async (key: string, value: boolean) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding: { update: { [key]: value } } }),
    })
    load()
  }

  if (loading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse h-24 bg-muted rounded-2xl" />)}</div>
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>

  const onboardingItems = [
    { key: "requirements", label: "Requirements Gathered" },
    { key: "payment", label: "Payment Received" },
    { key: "kickoff", label: "Kickoff Meeting Done" },
    { key: "accessGranted", label: "Access Granted" },
    { key: "contractSigned", label: "Contract Signed" },
  ]
  const onboardingDone = onboardingItems.filter(i => project.onboarding?.[i.key]).length
  const onboardingPct = Math.round((onboardingDone / onboardingItems.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">{project.name}</h1>
          <p className="text-muted-foreground text-sm">{project.client?.name} · {project.client?.company}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
          project.status === "COMPLETED" ? "bg-green-100 text-green-800" :
          project.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
          project.status === "ONBOARDING" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
        }`}>{project.status.replace("_", " ")}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground mb-3">Overall Progress</p>
            <div className="flex items-center gap-3">
              <Progress value={project.progress} className="flex-1" />
              <span className="text-2xl font-heading font-bold">{project.progress}%</span>
            </div>
            {project.deadline && <p className="text-xs text-muted-foreground mt-3">Deadline: {formatDate(project.deadline)}</p>}
          </CardContent>
        </Card>

        {/* Onboarding */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Onboarding Checklist
              <span className="text-xs font-normal text-muted-foreground">{onboardingDone}/{onboardingItems.length} complete ({onboardingPct}%)</span>
            </CardTitle>
            <Progress value={onboardingPct} className="h-1.5" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onboardingItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => updateOnboarding(item.key, !project.onboarding?.[item.key])}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {project.onboarding?.[item.key]
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <span className={project.onboarding?.[item.key] ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tasks ({project.tasks?.length || 0})</CardTitle>
            <Button size="sm" onClick={openAddTask} className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {project.tasks?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No tasks yet. Add your first task.</p>
          ) : (
            <div className="space-y-2">
              {project.tasks?.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                    {task.deadline && <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(task.deadline)}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityColors[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${taskStatusColors[task.status]}`}>{task.status.replace("_", " ")}</span>
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

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Add Task"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onTaskSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...register("title", { required: true })} placeholder="Task title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select defaultValue={editingTask?.status || "TODO"} onValueChange={v => setValue("status", v)}>
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
                <Select defaultValue={editingTask?.priority || "MEDIUM"} onValueChange={v => setValue("priority", v)}>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTask ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
