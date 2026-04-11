"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
  Plus, Bot, Zap, Bell, Mail, Loader2, Trash2, Pencil,
  ToggleLeft, ToggleRight, CheckCircle2, Clock, AlertCircle,
  FolderKanban, PhoneCall, Users,
} from "lucide-react"

const TRIGGERS = [
  { value: "payment_overdue",   label: "Payment Overdue",           icon: AlertCircle,   color: "bg-red-100 text-red-600" },
  { value: "lead_new",          label: "New Lead Added",            icon: Zap,           color: "bg-blue-100 text-blue-600" },
  { value: "project_completed", label: "Project Completed",         icon: FolderKanban,  color: "bg-green-100 text-green-600" },
  { value: "call_followup_due", label: "Follow-up Call Due",        icon: PhoneCall,     color: "bg-orange-100 text-orange-600" },
  { value: "client_inactive",   label: "Client Inactive (30 days)", icon: Users,         color: "bg-purple-100 text-purple-600" },
  { value: "task_overdue",      label: "Task Overdue",              icon: Clock,         color: "bg-yellow-100 text-yellow-700" },
  { value: "lead_converted",    label: "Lead Converted to Client",  icon: CheckCircle2,  color: "bg-teal-100 text-teal-600" },
]

const ACTIONS = [
  { value: "send_email",        label: "Send Email Reminder",    icon: Mail },
  { value: "create_task",       label: "Create Follow-up Task",  icon: CheckCircle2 },
  { value: "send_notification", label: "Send Notification",      icon: Bell },
  { value: "update_status",     label: "Update Status",          icon: Zap },
]

const PRESETS = [
  { name: "Payment Reminder",     trigger: "payment_overdue",   action: "send_email",        description: "Auto-send email when payment is overdue" },
  { name: "New Lead Follow-up",   trigger: "lead_new",          action: "create_task",       description: "Create a follow-up task for every new lead" },
  { name: "Project Completion",   trigger: "project_completed", action: "send_notification", description: "Notify team when a project is completed" },
  { name: "Call Follow-up Alert", trigger: "call_followup_due", action: "send_notification", description: "Remind about scheduled follow-up calls" },
  { name: "Inactive Client Alert",trigger: "client_inactive",   action: "send_email",        description: "Re-engage clients with no activity in 30 days" },
  { name: "Overdue Task Alert",   trigger: "task_overdue",      action: "create_task",       description: "Create a reminder task when a task is overdue" },
]

type FormData = { name: string; trigger: string; action: string; description?: string }

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>()
  const watchTrigger = watch("trigger")
  const watchAction = watch("action")

  const load = () => {
    setLoading(true)
    fetch("/api/automation")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setRules(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ name: "", trigger: "", action: "", description: "" })
    setOpen(true)
  }

  const openEdit = (rule: any) => {
    setEditing(rule)
    reset({ name: rule.name, trigger: rule.trigger, action: rule.action, description: rule.description || "" })
    setOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!data.trigger || !data.action) {
      toast({ title: "Please select a trigger and action", variant: "destructive" })
      return
    }
    setSaving(true)
    if (editing) {
      const res = await fetch("/api/automation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...data }),
      })
      setSaving(false)
      if (res.ok) { toast({ title: "Rule updated" }); setOpen(false); load() }
      else toast({ title: "Failed to update rule", variant: "destructive" })
    } else {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, active: true }),
      })
      setSaving(false)
      if (res.ok) { toast({ title: "Automation rule created" }); setOpen(false); reset(); load() }
      else toast({ title: "Failed to create rule", variant: "destructive" })
    }
  }

  const toggleRule = async (rule: any) => {
    setToggling(rule.id)
    await fetch("/api/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, active: !rule.active }),
    })
    setToggling(null)
    load()
  }

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this automation rule?")) return
    setDeleting(id)
    await fetch(`/api/automation?id=${id}`, { method: "DELETE" })
    setDeleting(null)
    toast({ title: "Rule deleted" })
    load()
  }

  const addPreset = async (preset: typeof PRESETS[0]) => {
    const res = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: preset.name, trigger: preset.trigger, action: preset.action, description: preset.description, active: true }),
    })
    if (res.ok) { toast({ title: `"${preset.name}" added` }); load() }
  }

  const activeCount = rules.filter(r => r.active).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Automation</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rules.length} rules · {activeCount} active
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2 self-start sm:self-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Rules",   value: rules.length,                                  color: "text-foreground" },
          { label: "Active",        value: activeCount,                                   color: "text-green-600" },
          { label: "Paused",        value: rules.length - activeCount,                    color: "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-heading font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Quick Templates</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESETS.map(preset => {
            const trig = TRIGGERS.find(t => t.value === preset.trigger)
            const Icon = trig?.icon || Bot
            const alreadyAdded = rules.some(r => r.name === preset.name)
            return (
              <Card key={preset.name} className={`border-0 shadow-sm transition-shadow ${alreadyAdded ? "opacity-50" : "hover:shadow-md"}`}>
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${trig?.color || "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-sm">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{preset.description}</p>
                  <Button
                    size="sm" variant="outline"
                    className="mt-3 h-7 text-xs w-full"
                    disabled={alreadyAdded}
                    onClick={() => addPreset(preset)}
                  >
                    {alreadyAdded ? "Already Added" : "Add Rule"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Rules List */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
          Your Rules ({rules.length})
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse h-16 bg-muted rounded-2xl" />)}
          </div>
        ) : rules.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="font-medium text-sm">No automation rules yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add a template above or create a custom rule</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => {
              const trig = TRIGGERS.find(t => t.value === rule.trigger)
              const act  = ACTIONS.find(a => a.value === rule.action)
              const TrigIcon = trig?.icon || Bot
              const ActIcon  = act?.icon  || Zap
              return (
                <Card key={rule.id} className={`border-0 shadow-sm transition-all ${!rule.active ? "opacity-60" : ""}`}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-3">

                      {/* Trigger icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${rule.active ? (trig?.color || "bg-muted text-muted-foreground") : "bg-muted text-muted-foreground"}`}>
                        <TrigIcon className="w-4 h-4" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{rule.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rule.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {rule.active ? "Active" : "Paused"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{trig?.label || rule.trigger}</span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <ActIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{act?.label || rule.action}</span>
                        </div>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">{rule.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8"
                          onClick={() => toggleRule(rule)}
                          disabled={toggling === rule.id}
                        >
                          {toggling === rule.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : rule.active
                              ? <ToggleRight className="w-5 h-5 text-green-500" />
                              : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          }
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(rule)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8 text-red-500"
                          onClick={() => deleteRule(rule.id)}
                          disabled={deleting === rule.id}
                        >
                          {deleting === rule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(null) }}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">
              {editing ? "Edit Rule" : "New Automation Rule"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {editing ? `Editing "${editing.name}"` : "Define a trigger and the action to take"}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Rule Name <span className="text-red-500">*</span></Label>
                <Input {...register("name", { required: true })} placeholder="e.g. Payment Reminder" className="h-10" />
                {errors.name && <p className="text-xs text-red-500">Name is required</p>}
              </div>

              {/* Trigger */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">When this happens… <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-1 gap-2">
                  {TRIGGERS.map(t => {
                    const Icon = t.icon
                    const selected = watchTrigger === t.value
                    return (
                      <button
                        key={t.value} type="button"
                        onClick={() => setValue("trigger", t.value)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                          selected ? "border-[#ecc94b] bg-[#ecc94b]/10 ring-1 ring-[#ecc94b]" : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">{t.label}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-[#b7950b] ml-auto shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Action */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Then do this… <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIONS.map(a => {
                    const Icon = a.icon
                    const selected = watchAction === a.value
                    return (
                      <button
                        key={a.value} type="button"
                        onClick={() => setValue("action", a.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                          selected ? "border-[#ecc94b] bg-[#ecc94b]/10 ring-1 ring-[#ecc94b]" : "border-border hover:bg-muted"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${selected ? "text-[#b7950b]" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold leading-tight">{a.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input {...register("description")} placeholder="What does this rule do?" className="h-10" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editing ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
