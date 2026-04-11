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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader, SearchBar, SkeletonRows } from "@/components/ui/shared"
import { toast } from "@/hooks/use-toast"
import { getInitials, formatDate, formatCurrencyIntl, CURRENCIES } from "@/lib/utils"
import { Plus, Pencil, Trash2, Eye, Download, Loader2 } from "lucide-react"
import Papa from "papaparse"

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.string().default("active"),
  tag: z.string().default("REGULAR"),
  currency: z.string().default("INR"),
})
type FormData = z.infer<typeof schema>

const tagColors: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800",
  HIGH_VALUE: "bg-purple-100 text-purple-800",
  LEAD: "bg-blue-100 text-blue-800",
  REGULAR: "bg-gray-100 text-gray-700",
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const load = () => { setLoading(true); fetch("/api/clients").then(r => r.ok ? r.json() : []).then(d => { setClients(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); reset({ name: "", email: "", phone: "", company: "", status: "active", tag: "REGULAR", currency: "INR" }); setOpen(true) }
  const openEdit = (c: any) => { setEditing(c); reset({ name: c.name, email: c.email, phone: c.phone || "", company: c.company || "", status: c.status || "active", tag: c.tag || "REGULAR", currency: c.currency || "INR" }); setOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const res = await fetch(editing ? `/api/clients/${editing.id}` : "/api/clients", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (res.ok) { toast({ title: editing ? "Client updated" : "Client added" }); setOpen(false); load() }
    else toast({ title: "Error", variant: "destructive" })
  }

  const deleteClient = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return
    await fetch(`/api/clients/${id}`, { method: "DELETE" })
    toast({ title: "Client deleted" }); load()
  }

  const exportCSV = () => {
    const csv = Papa.unparse(clients.map(c => ({ Name: c.name, Email: c.email, Phone: c.phone, Company: c.company, Status: c.status, Tag: c.tag, Created: formatDate(c.createdAt) })))
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "clients.csv"; a.click()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title="Clients" sub={`${clients.length} total clients`}>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 flex-1 sm:flex-none"><Download className="w-4 h-4" /> Export</Button>
        <Button size="sm" onClick={openAdd} className="gap-2 flex-1 sm:flex-none"><Plus className="w-4 h-4" /> Add Client</Button>
      </PageHeader>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search clients..." />
          {loading ? <SkeletonRows count={5} height="h-14" /> : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">No clients found</p>
                  : filtered.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                      <Avatar className="w-10 h-10 shrink-0"><AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${tagColors[c.tag] || tagColors.REGULAR}`}>{c.tag}</span>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => router.push(`/clients/${c.id}`)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => deleteClient(c.id, c.name)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
              </div>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead><TableHead>Company</TableHead><TableHead>Tag</TableHead>
                      <TableHead>Projects</TableHead><TableHead>Revenue</TableHead><TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0
                      ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No clients found</TableCell></TableRow>
                      : filtered.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9"><AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback></Avatar>
                              <div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{c.company || "—"}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-1 rounded-full font-medium ${tagColors[c.tag] || tagColors.REGULAR}`}>{c.tag}</span></TableCell>
                          <TableCell className="text-sm">{c.projects?.length || 0}</TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrencyIntl(c.payments?.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + p.amount, 0) || 0, c.currency || "INR")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => router.push(`/clients/${c.id}`)}><Eye className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => deleteClient(c.id, c.name)}><Trash2 className="w-4 h-4" /></Button>
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
            <DialogTitle className="text-base font-heading font-bold">{editing ? "Edit Client" : "New Client"}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editing ? `Editing ${editing.name}` : "Fill in the details to add a new client"}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">

              {/* ── Contact Info ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Contact Info</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                    <Input {...register("name")} placeholder="John Smith" className="h-10" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
                    <Input {...register("email")} placeholder="john@company.com" className="h-10" />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
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

              {/* ── Status & Tag ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Classification</p>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([{v:"active",l:"Active",a:"bg-green-50 text-green-700 ring-2 ring-green-400 border-transparent"},{v:"inactive",l:"Inactive",a:"bg-gray-100 text-gray-700 ring-2 ring-gray-400 border-transparent"},{v:"churned",l:"Churned",a:"bg-red-50 text-red-700 ring-2 ring-red-400 border-transparent"}]).map(opt => (
                      <button key={opt.v} type="button" onClick={() => setValue("status", opt.v)}
                        className={`py-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                          watch("status") === opt.v ? opt.a : "border-border text-muted-foreground hover:bg-muted"
                        }`}>{opt.l}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tag</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {([{v:"REGULAR",l:"Regular",a:"bg-gray-100 text-gray-700 ring-2 ring-gray-400 border-transparent"},{v:"VIP",l:"VIP",a:"bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent"},{v:"HIGH_VALUE",l:"High Value",a:"bg-purple-50 text-purple-700 ring-2 ring-purple-400 border-transparent"},{v:"LEAD",l:"Lead",a:"bg-blue-50 text-blue-700 ring-2 ring-blue-400 border-transparent"}]).map(opt => (
                      <button key={opt.v} type="button" onClick={() => setValue("tag", opt.v)}
                        className={`py-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                          watch("tag") === opt.v ? opt.a : "border-border text-muted-foreground hover:bg-muted"
                        }`}>{opt.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* ── Currency ── */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Billing</p>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select key={editing?.currency ?? "new"} defaultValue={editing?.currency || "INR"} onValueChange={v => setValue("currency", v)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Used for all payments & invoices for this client</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editing ? "Update Client" : "Add Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
