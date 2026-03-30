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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Plus, UserCheck, Loader2, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const STAGES = [
  { key: "NEW", label: "New", color: "bg-blue-500" },
  { key: "CONTACTED", label: "Contacted", color: "bg-yellow-500" },
  { key: "QUALIFIED", label: "Qualified", color: "bg-purple-500" },
  { key: "CONVERTED", label: "Converted", color: "bg-green-500" },
  { key: "LOST", label: "Lost", color: "bg-red-500" },
]

const schema = z.object({
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
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const load = () => {
    fetch("/api/leads").then(r => r.json()).then(d => { setLeads(d); setLoading(false) })
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

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    setSaving(false)
    if (res.ok) { toast({ title: "Lead added" }); setOpen(false); reset(); load() }
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
        <Button size="sm" onClick={() => { reset({ status: "NEW" }); setOpen(true) }} className="gap-2 self-start sm:self-auto">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input {...register("name")} placeholder="Alice Brown" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...register("email")} placeholder="alice@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register("phone")} placeholder="+1-555-0100" />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input {...register("company")} placeholder="Company Inc." />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select onValueChange={v => setValue("source", v)}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {["Website", "Referral", "LinkedIn", "Cold Email", "Social Media", "Other"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deal Value ($)</Label>
                <Input {...register("value")} type="number" placeholder="5000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select defaultValue="NEW" onValueChange={v => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
