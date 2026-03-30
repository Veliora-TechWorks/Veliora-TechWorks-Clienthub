"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { formatDate, formatDateTime } from "@/lib/utils"
import { Plus, Search, Trash2, Loader2, Calendar } from "lucide-react"

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => {
    setLoading(true)
    Promise.all([fetch("/api/calls").then(r => r.json()), fetch("/api/clients").then(r => r.json())])
      .then(([c, cl]) => { setCalls(c); setClients(cl); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const onSubmit = async (data: any) => {
    setSaving(true)
    const res = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    setSaving(false)
    if (res.ok) { toast({ title: "Call logged" }); setOpen(false); reset(); load() }
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
        <Button size="sm" onClick={() => { reset({ date: new Date().toISOString().slice(0, 16) }); setOpen(true) }} className="gap-2 self-start sm:self-auto">
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
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 shrink-0" onClick={() => deleteCall(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => deleteCall(c.id)}>
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
          <DialogHeader><DialogTitle>Log a Call</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select onValueChange={v => setValue("clientId", v)}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date & Time</Label>
                <Input {...register("date")} type="datetime-local" />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input {...register("duration")} type="number" placeholder="30" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="What was discussed..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Input {...register("outcome")} placeholder="e.g. Positive - proceeding with proposal" />
            </div>
            <div className="space-y-1.5">
              <Label>Schedule Follow-up</Label>
              <Input {...register("nextCall")} type="date" />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Log Call"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
