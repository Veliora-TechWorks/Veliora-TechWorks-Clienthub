"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Plus, UserCheck, Loader2, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const STAGES = [
  { key: "NEW",       label: "New",       color: "bg-blue-500",   activeClass: "bg-blue-50 text-blue-700 ring-2 ring-blue-400" },
  { key: "CONTACTED", label: "Contacted", color: "bg-yellow-500", activeClass: "bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400" },
  { key: "QUALIFIED", label: "Qualified", color: "bg-purple-500", activeClass: "bg-purple-50 text-purple-700 ring-2 ring-purple-400" },
  { key: "CONVERTED", label: "Converted", color: "bg-green-500",  activeClass: "bg-green-50 text-green-700 ring-2 ring-green-400" },
  { key: "LOST",      label: "Lost",      color: "bg-red-500",    activeClass: "bg-red-50 text-red-700 ring-2 ring-red-400" },
]

const schema = z.object({
  leadId:  z.string().optional(),
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  value: z.coerce.number().optional(),
  status: z.string().default("NEW"),
})
type FormData = z.infer<typeof schema>

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [leadStage, setLeadStage] = useState("NEW")
  const [leadSource, setLeadSource] = useState("")
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const load = () => {
    fetch("/api/leads")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const getByStatus = (status: string) => leads.filter(l => l.status === status)

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, status: newStatus } : l))
    await fetch(`/api/leads/${draggableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const openEdit = (lead: any) => {
    setEditing(lead)
    setLeadStage(lead.status || "NEW")
    setLeadSource(lead.source || "")
    reset({ leadId: lead.leadId || "", name: lead.name, email: lead.email || "", phone: lead.phone || "", company: lead.company || "", value: lead.value || "", status: lead.status })
    setOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    if (editing) {
      const res = await fetch(`/api/leads/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, status: leadStage, source: leadSource || data.source }) })
      setSaving(false)
      if (res.ok) { toast({ title: "Lead updated" }); setOpen(false); reset(); setEditing(null); load() }
    } else {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, status: leadStage, source: leadSource || data.source }) })
      setSaving(false)
      if (res.ok) { toast({ title: "Lead added" }); setOpen(false); reset(); load() }
    }
  }

  const convertToClient = async (id: string, name: string) => {
    if (!confirm(`Convert ${name} to a client?`)) return
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ convertToClient: true }),
    })
    if (res.ok) { toast({ title: `${name} converted to client!`, variant: "default" }); load() }
  }

  const deleteLead = async (id: string) => {
    await fetch(`/api/leads/${id}`, { method: "DELETE" })
    toast({ title: "Lead deleted" })
    load()
  }

  const totalValue = leads.reduce((s, l) => s + (l.value || 0), 0)
  const convertedValue = leads.filter(l => l.status === "CONVERTED").reduce((s, l) => s + (l.value || 0), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Lead Pipeline</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {leads.length} leads · {formatCurrency(totalValue)} pipeline · {formatCurrency(convertedValue)} converted
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); reset({ leadId: "", status: "NEW" }); setLeadStage("NEW"); setLeadSource(""); setOpen(true) }} className="gap-2 self-start sm:self-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map(s => (
            <div key={s.key} className="space-y-3 min-w-[200px]">
              <div className="animate-pulse h-8 bg-muted rounded-xl" />
              {Array(2).fill(0).map((_, i) => <div key={i} className="animate-pulse h-24 bg-muted rounded-xl" />)}
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-3 md:grid md:grid-cols-5" style={{ minWidth: "900px" }}>
              {STAGES.map(stage => {
                const stageLeads = getByStatus(stage.key)
                return (
                  <div key={stage.key} className="w-[200px] md:w-auto flex-shrink-0 md:flex-shrink">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className="text-sm font-semibold">{stage.label}</span>
                      <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                    </div>
                    <Droppable droppableId={stage.key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] rounded-2xl p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-[#ecc94b]/10 border-2 border-dashed border-[#ecc94b]" : "bg-muted/40"}`}
                        >
                          {stageLeads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white dark:bg-card rounded-xl p-3 shadow-sm border border-border cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? "shadow-lg rotate-1" : ""}`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="font-medium text-sm leading-tight">{lead.name}</p>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0">
                                          <MoreHorizontal className="w-3 h-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(lead)}>
                                          <Pencil className="w-4 h-4 mr-2" /> Edit Lead
                                        </DropdownMenuItem>
                                        {lead.status !== "CONVERTED" && (
                                          <DropdownMenuItem onClick={() => convertToClient(lead.id, lead.name)}>
                                            <UserCheck className="w-4 h-4 mr-2 text-green-600" /> Convert to Client
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => deleteLead(lead.id)} className="text-red-600">
                                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  {lead.company && <p className="text-xs text-muted-foreground mt-0.5">{lead.company}</p>}
                                  {lead.leadId && <p className="text-xs font-mono text-muted-foreground">{lead.leadId}</p>}
                                  {lead.source && <p className="text-xs text-muted-foreground">via {lead.source}</p>}
                                  {lead.value && (
                                    <p className="text-xs font-semibold text-[#b7950b] mt-1.5">{formatCurrency(lead.value)}</p>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(null) }}>
        <DialogContent className="max-w-lg p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">{editing ? "Edit Lead" : "New Lead"}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editing ? `Editing ${editing?.name}` : "Add a new lead to your pipeline"}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">

              {/* ── Contact ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Contact</p>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Lead ID <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                  <Input {...register("leadId")} placeholder="e.g. LEAD-001" className="h-10 font-mono" />
                  <p className="text-xs text-muted-foreground">Custom identifier for this lead</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Name <span className="text-red-500">*</span></Label>
                    <Input {...register("name")} placeholder="Alice Brown" className="h-10" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input {...register("email")} placeholder="alice@company.com" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Phone</Label>
                    <Input {...register("phone")} placeholder="+91-98765-43210" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Company</Label>
                    <Input {...register("company")} placeholder="Company Inc." className="h-10" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* ── Pipeline Stage ── */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pipeline Stage</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {STAGES.map(s => (
                    <button key={s.key} type="button" onClick={() => setLeadStage(s.key)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                        leadStage === s.key
                          ? `${s.activeClass} border-transparent`
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* ── Deal Info ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Deal Info</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Deal Value (₹)</Label>
                    <Input {...register("value")} type="number" placeholder="50000" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Source</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Website","Referral","LinkedIn","Cold Email","Social","Other"].map(s => (
                        <button key={s} type="button" onClick={() => setLeadSource(s)}
                          className={`py-1.5 rounded-lg border text-[10px] font-semibold transition-all text-center ${
                            leadSource === s
                              ? "bg-[#ecc94b]/20 text-[#b7950b] ring-2 ring-[#ecc94b] border-transparent"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{editing ? "Saving…" : "Adding…"}</> : editing ? "Update Lead" : "Add Lead"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
