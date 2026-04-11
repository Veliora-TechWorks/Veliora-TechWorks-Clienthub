"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { formatDate, formatDateTime } from "@/lib/utils"
import { Plus, Search, Trash2, Loader2, Calendar, Pencil } from "lucide-react"

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => {
    setLoading(true)
    Promise.all([fetch("/api/calls").then(r => r.json()), fetch("/api/clients").then(r => r.json())])
      .then(([c, cl]) => { setCalls(Array.isArray(c) ? c : []); setClients(Array.isArray(cl) ? cl : []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ date: new Date().toISOString().slice(0, 16), clientId: "", duration: "", outcome: "", notes: "", nextCall: "" })
    setOpen(true)
  }
  const openEdit = (c: any) => {
    setEditing(c)
    reset({
      clientId: c.clientId,
      date: c.date ? c.date.slice(0, 16) : "",
      duration: c.duration || "",
      outcome: c.outcome || "",
      notes: c.notes || "",
      nextCall: c.nextCall ? c.nextCall.split("T")[0] : "",
    })
    setOpen(true)
  }

  const onSubmit = async (data: any) => {
    setSaving(true)
    if (editing) {
      const res = await fetch(`/api/calls/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      setSaving(false)
      if (res.ok) { toast({ title: "Call updated" }); setOpen(false); reset(); load() }
    } else {
      const res = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      setSaving(false)
      if (res.ok) { toast({ title: "Call logged" }); setOpen(false); reset(); load() }
    }
  }

  const deleteCall = async (id: string) => {
    if (!confirm("Delete this call log?")) return
    await fetch(`/api/calls/${id}`, { method: "DELETE" })
    toast({ title: "Call deleted" })
    load()
  }

  const filtered = calls.filter(c =>
    (c.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.notes || "").toLowerCase().includes(search.toLowerCase())
  )

  const upcoming = calls.filter(c => c.nextCall && new Date(c.nextCall) > new Date())

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Call Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">{calls.length} calls · {upcoming.length} follow-ups scheduled</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2 self-start sm:self-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold">
          <Plus className="w-4 h-4" /> Log Call
        </Button>
      </div>

      {/* Upcoming Follow-ups */}
      {upcoming.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcoming.slice(0, 3).map(c => (
            <Card key={c.id} className="border-0 shadow-sm border-l-4 border-l-[#f97316]">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-[#f97316]" />
                  <span className="text-xs font-semibold text-[#f97316]">Follow-up Due</span>
                </div>
                <p className="font-medium text-sm">{c.client?.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(c.nextCall)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search calls..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-16 bg-muted rounded-xl" />)}</div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No calls logged yet</p>
                ) : filtered.map(c => (
                  <div key={c.id} className="p-3 rounded-xl border border-border bg-background">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-medium text-sm">{c.client?.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(c.date)}{c.duration ? ` · ${c.duration} min` : ""}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500" onClick={() => deleteCall(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    {c.notes && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.notes}</p>}
                    {c.nextCall && (
                      <p className={`text-xs font-medium mt-1 ${new Date(c.nextCall) < new Date() ? "text-red-500" : "text-[#f97316]"}`}>
                        Follow-up: {formatDate(c.nextCall)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No calls logged yet</TableCell></TableRow>
                    ) : filtered.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{c.client?.name}</p>
                            <p className="text-xs text-muted-foreground">{c.client?.company}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(c.date)}</TableCell>
                        <TableCell className="text-sm">{c.duration ? `${c.duration} min` : "—"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{c.notes || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{c.outcome || "—"}</TableCell>
                        <TableCell>
                          {c.nextCall ? (
                            <span className={`text-xs font-medium ${new Date(c.nextCall) < new Date() ? "text-red-500" : "text-[#f97316]"}`}>
                              {formatDate(c.nextCall)}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => deleteCall(c.id)}><Trash2 className="w-4 h-4" /></Button>
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
        <DialogContent className="max-w-lg p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">{editing ? "Edit Call" : "Log a Call"}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editing ? "Update call details" : "Record a client call and schedule follow-ups"}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">

              {/* Client */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Client <span className="text-red-500">*</span></Label>
                <Select key={editing?.clientId ?? "new"} defaultValue={editing?.clientId} onValueChange={v => setValue("clientId", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select a client…" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="border-t border-border" />

              {/* Date & Duration */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Call Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Date & Time</Label>
                    <Input {...register("date")} type="datetime-local" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Duration (minutes)</Label>
                    <Input {...register("duration")} type="number" placeholder="30" className="h-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Outcome</Label>
                  <Input {...register("outcome")} placeholder="e.g. Positive — proceeding with proposal" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea {...register("notes")} placeholder="What was discussed…" rows={3} className="resize-none" />
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Follow-up */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Follow-up</p>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Schedule Follow-up Date</Label>
                  <Input {...register("nextCall")} type="date" className="h-10" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editing ? "Update Call" : "Log Call"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
