"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Plus, Bot, Zap, Bell, Mail, Loader2, ToggleLeft, ToggleRight } from "lucide-react"

const TRIGGERS = [
  { value: "payment_overdue", label: "Payment Overdue" },
  { value: "lead_new", label: "New Lead Added" },
  { value: "project_completed", label: "Project Completed" },
  { value: "call_followup_due", label: "Follow-up Due" },
  { value: "client_inactive", label: "Client Inactive (30 days)" },
]

const ACTIONS = [
  { value: "send_email", label: "Send Email Reminder" },
  { value: "create_task", label: "Create Follow-up Task" },
  { value: "send_notification", label: "Send Notification" },
  { value: "update_status", label: "Update Status" },
]

const triggerIcons: Record<string, any> = {
  payment_overdue: Bell,
  lead_new: Zap,
  project_completed: Bot,
  call_followup_due: Bell,
  client_inactive: Mail,
}

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => {
    fetch("/api/automation").then(r => r.json()).then(d => { setRules(d); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const onSubmit = async (data: any) => {
    setSaving(true)
    await fetch("/api/automation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    setSaving(false)
    toast({ title: "Automation rule created" })
    setOpen(false)
    reset()
    load()
  }

  const toggleRule = async (id: string, active: boolean) => {
    await fetch(`/api/automation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    })
    load()
  }

  const presets = [
    { name: "Payment Reminder", trigger: "payment_overdue", action: "send_email", description: "Auto-send email when payment is overdue" },
    { name: "New Lead Follow-up", trigger: "lead_new", action: "create_task", description: "Create a follow-up task for every new lead" },
    { name: "Project Completion", trigger: "project_completed", action: "send_notification", description: "Notify team when project is completed" },
    { name: "Call Follow-up", trigger: "call_followup_due", action: "send_notification", description: "Remind about scheduled follow-up calls" },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Automation</h1>
          <p className="text-muted-foreground text-sm mt-1">Set up automated workflows and triggers</p>
        </div>
        <Button size="sm" onClick={() => { reset(); setOpen(true) }} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      {/* Preset Templates */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Templates</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const Icon = triggerIcons[preset.trigger] || Bot
            return (
              <Card key={preset.name} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-3 md:p-4">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-[#ecc94b]/20 rounded-xl flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#ecc94b]/40 transition-colors">
                    <Icon className="w-4 h-4 text-[#b7950b]" />
                  </div>
                  <p className="font-semibold text-xs md:text-sm">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{preset.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 md:mt-3 h-7 text-xs w-full"
                    onClick={async () => {
                      await fetch("/api/automation", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: preset.name, trigger: preset.trigger, action: preset.action, active: true }),
                      })
                      toast({ title: `"${preset.name}" rule created` })
                      load()
                    }}
                  >
                    Add Rule
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Active Rules */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Active Rules ({rules.length})</p>
        {loading ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse h-16 bg-muted rounded-2xl" />)}</div>
        ) : rules.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No automation rules yet. Add one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => {
              const Icon = triggerIcons[rule.trigger] || Bot
              return (
                <Card key={rule.id} className="border-0 shadow-sm">
                  <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 ${rule.active ? "bg-[#ecc94b]/20" : "bg-muted"}`}>
                      <Icon className={`w-4 h-4 ${rule.active ? "text-[#b7950b]" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {TRIGGERS.find(t => t.value === rule.trigger)?.label || rule.trigger}
                        {" → "}
                        {ACTIONS.find(a => a.value === rule.action)?.label || rule.action}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block ${rule.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {rule.active ? "Active" : "Paused"}
                      </span>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => toggleRule(rule.id, rule.active)}>
                        {rule.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>Create Automation Rule</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rule Name *</Label>
              <Input {...register("name", { required: true })} placeholder="e.g. Payment Reminder" />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger (When...)</Label>
              <Select onValueChange={v => setValue("trigger", v)}>
                <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                <SelectContent>{TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Action (Then...)</Label>
              <Select onValueChange={v => setValue("action", v)}>
                <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
