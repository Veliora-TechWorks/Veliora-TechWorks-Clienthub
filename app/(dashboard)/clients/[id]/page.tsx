"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { formatCurrency, formatDate, formatDateTime, getInitials, CURRENCIES } from "@/lib/utils"
import { ArrowLeft, Phone, Mail, Building2, Calendar, CheckCircle2, Circle, Plus, Loader2, FolderKanban, DollarSign, PhoneCall, ExternalLink } from "lucide-react"

const tagColors: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800",
  HIGH_VALUE: "bg-purple-100 text-purple-800",
  LEAD: "bg-blue-100 text-blue-800",
  REGULAR: "bg-gray-100 text-gray-700",
}
const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  OVERDUE: "bg-red-100 text-red-800",
}
const projectStatusColors: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-gray-100 text-gray-700",
  COMPLETED: "bg-green-100 text-green-800",
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Quick-action dialogs
  const [projOpen, setProjOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [payStatus, setPayStatus] = useState("PENDING")

  const projForm = useForm<any>()
  const payForm = useForm<any>()
  const callForm = useForm<any>()

  const load = () => {
    setLoading(true)
    fetch(`/api/clients/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setClient(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const addProject = async (data: any) => {
    setSaving(true)
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, clientId: id, priority: "MEDIUM", status: "ONBOARDING", progress: 0 }),
    })
    setSaving(false)
    if (res.ok) { toast({ title: "Project created" }); setProjOpen(false); projForm.reset(); load() }
    else toast({ title: "Failed to create project", variant: "destructive" })
  }

  const addPayment = async (data: any) => {
    setSaving(true)
    const res = await fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, clientId: id, status: payStatus }),
    })
    setSaving(false)
    if (res.ok) { toast({ title: "Payment added" }); setPayOpen(false); payForm.reset(); load() }
    else toast({ title: "Failed to add payment", variant: "destructive" })
  }

  const logCall = async (data: any) => {
    setSaving(true)
    const res = await fetch("/api/calls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, clientId: id }),
    })
    setSaving(false)
    if (res.ok) { toast({ title: "Call logged" }); setCallOpen(false); callForm.reset(); load() }
    else toast({ title: "Failed to log call", variant: "destructive" })
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="animate-pulse h-8 bg-muted rounded w-48" />
      <div className="animate-pulse h-48 bg-muted rounded-2xl" />
    </div>
  )

  if (!client) return <div className="text-center py-20 text-muted-foreground">Client not found</div>

  const totalPaid = client.payments?.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + p.amount, 0) || 0
  const totalPending = client.payments?.filter((p: any) => p.status === "PENDING").reduce((s: number, p: any) => s + p.amount, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">{client.name}</h1>
          <p className="text-muted-foreground text-sm">{client.company || "Individual Client"}</p>
        </div>
        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap justify-end">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => { projForm.reset({ name: "", startDate: "", endDate: "" }); setProjOpen(true) }}>
            <FolderKanban className="w-3.5 h-3.5" /> Add Project
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => { payForm.reset({ amount: "", description: "", dueDate: "" }); setPayStatus("PENDING"); setPayOpen(true) }}>
            <DollarSign className="w-3.5 h-3.5" /> Add Payment
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => { callForm.reset({ date: new Date().toISOString().slice(0, 16) }); setCallOpen(true) }}>
            <PhoneCall className="w-3.5 h-3.5" /> Log Call
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">{getInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{client.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Since {formatDate(client.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tagColors[client.tag]}`}>{client.tag}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${client.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{client.status}</span>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-bold">{client.projects?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Projects</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({client.projects?.length || 0})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({client.payments?.length || 0})</TabsTrigger>
          <TabsTrigger value="calls">Calls ({client.callLogs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 h-8 bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold" onClick={() => { projForm.reset({ name: "", startDate: "", endDate: "" }); setProjOpen(true) }}>
              <Plus className="w-3.5 h-3.5" /> New Project
            </Button>
          </div>
          {client.projects?.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">No projects yet</CardContent></Card>
          ) : client.projects?.map((p: any) => (
            <Card key={p.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/projects/${p.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.endDate && <p className="text-xs text-muted-foreground">Due {formatDate(p.endDate)}</p>}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-[#b7950b] font-medium mt-0.5 hover:underline">
                        <ExternalLink className="w-3 h-3" /> View Live
                      </a>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${projectStatusColors[p.status]}`}>{p.status?.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={p.progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium w-10 text-right">{p.progress}%</span>
                </div>
                {p.onboarding && (
                  <div className="mt-3 flex gap-3 flex-wrap">
                    {["requirements", "payment", "kickoff", "accessGranted", "contractSigned"].map(key => (
                      <div key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
                        {p.onboarding[key] ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Circle className="w-3.5 h-3.5" />}
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 h-8 bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold" onClick={() => { payForm.reset({ amount: "", description: "", dueDate: "" }); setPayStatus("PENDING"); setPayOpen(true) }}>
              <Plus className="w-3.5 h-3.5" /> Add Payment
            </Button>
          </div>
          {client.payments?.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">No payments yet</CardContent></Card>
          ) : client.payments?.map((p: any) => (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.description || "Payment"}</p>
                  <p className="text-xs text-muted-foreground">{p.paidAt ? `Paid ${formatDate(p.paidAt)}` : p.dueDate ? `Due ${formatDate(p.dueDate)}` : "No date"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[p.status]}`}>{p.status}</span>
                  <span className="font-heading font-bold">{formatCurrency(p.amount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calls" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 h-8 bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold" onClick={() => { callForm.reset({ date: new Date().toISOString().slice(0, 16) }); setCallOpen(true) }}>
              <Plus className="w-3.5 h-3.5" /> Log Call
            </Button>
          </div>
          {client.callLogs?.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">No calls logged yet</CardContent></Card>
          ) : client.callLogs?.map((c: any) => (
            <Card key={c.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formatDateTime(c.date)}</p>
                    {c.notes && <p className="text-sm text-muted-foreground mt-1">{c.notes}</p>}
                    {c.outcome && <p className="text-xs text-green-600 mt-1 font-medium">Outcome: {c.outcome}</p>}
                  </div>
                  {c.duration && <span className="text-xs text-muted-foreground">{c.duration} min</span>}
                </div>
                {c.nextCall && <p className="text-xs text-[#f97316] mt-2 font-medium">Follow-up: {formatDate(c.nextCall)}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Project Dialog */}
      <Dialog open={projOpen} onOpenChange={setProjOpen}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">New Project for {client.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">Create a project linked to this client</p>
          </DialogHeader>
          <form onSubmit={projForm.handleSubmit(addProject)}>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></Label>
                <Input {...projForm.register("name", { required: true })} placeholder="e.g. Website Redesign" className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Start Date <span className="text-red-500">*</span></Label>
                  <Input {...projForm.register("startDate", { required: true })} type="date" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">End Date <span className="text-red-500">*</span></Label>
                  <Input {...projForm.register("endDate", { required: true })} type="date" className="h-10" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setProjOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">Add Payment for {client.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">Record a payment transaction</p>
          </DialogHeader>
          <form onSubmit={payForm.handleSubmit(addPayment)}>
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-2">
                <Select defaultValue={client.currency || "INR"} onValueChange={v => payForm.setValue("currency", v)}>
                  <SelectTrigger className="w-24 h-10 shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
                </Select>
                <Input {...payForm.register("amount", { required: true })} type="number" step="0.01" placeholder="Amount" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Description</Label>
                <Input {...payForm.register("description")} placeholder="e.g. Project milestone payment" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([{v:"PENDING",l:"Pending",a:"bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent"},{v:"PAID",l:"Paid",a:"bg-green-50 text-green-700 ring-2 ring-green-400 border-transparent"},{v:"OVERDUE",l:"Overdue",a:"bg-red-50 text-red-700 ring-2 ring-red-400 border-transparent"}]).map(opt => (
                    <button key={opt.v} type="button" onClick={() => setPayStatus(opt.v)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${payStatus === opt.v ? opt.a : "border-border text-muted-foreground hover:bg-muted"}`}>{opt.l}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Due Date</Label>
                <Input {...payForm.register("dueDate")} type="date" className="h-10" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Add Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Call Dialog */}
      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">Log Call with {client.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">Record a call and schedule follow-ups</p>
          </DialogHeader>
          <form onSubmit={callForm.handleSubmit(logCall)}>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <Input {...callForm.register("date")} type="datetime-local" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Duration (min)</Label>
                  <Input {...callForm.register("duration")} type="number" placeholder="30" className="h-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Outcome</Label>
                <Input {...callForm.register("outcome")} placeholder="e.g. Positive — proceeding" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea {...callForm.register("notes")} placeholder="What was discussed…" rows={3} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Follow-up Date</Label>
                <Input {...callForm.register("nextCall")} type="date" className="h-10" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setCallOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Log Call"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
