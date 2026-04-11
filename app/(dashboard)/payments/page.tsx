"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, SearchBar, SkeletonRows, StatusBadge } from "@/components/ui/shared"
import { toast } from "@/hooks/use-toast"
import { formatCurrency, formatCurrencyIntl, formatDate, CURRENCIES } from "@/lib/utils"
import { Plus, Download, Loader2, CheckCircle, Clock, AlertCircle, Pencil, Trash2 } from "lucide-react"

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  OVERDUE: "bg-red-100 text-red-800",
}

function AmountCell({ amount, currency }: { amount: number; currency: string }) {
  return (
    <div>
      <p className="font-heading font-bold text-sm">{formatCurrencyIntl(amount, currency)}</p>
      {currency !== "INR" && <p className="text-[10px] text-muted-foreground">{formatCurrency(amount)}</p>}
    </div>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [payOpen, setPayOpen] = useState(false)
  const [invOpen, setInvOpen] = useState(false)
  const [editingPay, setEditingPay] = useState<any>(null)
  const [editingInv, setEditingInv] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [payStatus, setPayStatus] = useState("PENDING")
  const [selectedClientId, setSelectedClientId] = useState("")
  const payForm = useForm<any>()
  const invForm = useForm<any>()

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/payments").then(r => r.json()),
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/clients").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]).then(([p, inv, c, proj]) => {
      setPayments(Array.isArray(p) ? p : [])
      setInvoices(Array.isArray(inv) ? inv : [])
      setClients(Array.isArray(c) ? c : [])
      setProjects(Array.isArray(proj) ? proj : [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const clientCurrency = (id: string) => clients.find(c => c.id === id)?.currency || "INR"
  const totalPaid = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0)
  const totalOverdue = payments.filter(p => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0)

  const openAddPay = () => {
    setEditingPay(null)
    setPayStatus("PENDING")
    setSelectedClientId("")
    payForm.reset({ clientId: "", projectId: "", amount: "", description: "", dueDate: "", currency: "INR" })
    setPayOpen(true)
  }
  const openEditPay = (p: any) => {
    setEditingPay(p)
    setPayStatus(p.status || "PENDING")
    setSelectedClientId(p.clientId || "")
    payForm.reset({ clientId: p.clientId, projectId: p.projectId || "", amount: p.amount, description: p.description || "", dueDate: p.dueDate ? p.dueDate.split("T")[0] : "", currency: p.currency || "INR" })
    setPayOpen(true)
  }
  const openEditInv = (inv: any) => {
    setEditingInv(inv)
    invForm.reset({ clientId: inv.clientId, description: inv.items?.[0]?.description || "", amount: inv.items?.[0]?.amount || inv.subtotal, tax: inv.tax || 0, dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "" })
    setInvOpen(true)
  }

  const onPaySubmit = async (data: any) => {
    setSaving(true)
    const body = { ...data, status: payStatus }
    if (editingPay) {
      await fetch(`/api/payments/${editingPay.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      toast({ title: "Payment updated" })
    } else {
      await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      toast({ title: "Payment added" })
    }
    setSaving(false); setPayOpen(false); payForm.reset(); load()
  }

  const onInvSubmit = async (data: any) => {
    setSaving(true)
    const amount = parseFloat(data.amount), tax = parseFloat(data.tax || "0")
    const body = { clientId: data.clientId, items: [{ description: data.description, quantity: 1, rate: amount, amount }], subtotal: amount, tax, total: amount + tax, dueDate: data.dueDate || null }
    if (editingInv) {
      await fetch(`/api/invoices/${editingInv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      toast({ title: "Invoice updated" })
    } else {
      await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      toast({ title: "Invoice created" })
    }
    setSaving(false); setInvOpen(false); invForm.reset(); setEditingInv(null); load()
  }

  const markPaid = async (id: string) => {
    await fetch(`/api/payments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }) })
    toast({ title: "Marked as paid" }); load()
  }

  const deletePay = async (id: string) => {
    if (!confirm("Delete this payment?")) return
    await fetch(`/api/payments/${id}`, { method: "DELETE" })
    toast({ title: "Payment deleted" }); load()
  }

  const deleteInv = async (id: string) => {
    if (!confirm("Delete this invoice?")) return
    await fetch(`/api/invoices/${id}`, { method: "DELETE" })
    toast({ title: "Invoice deleted" }); load()
  }

  const filtered = payments.filter(p =>
    (p.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  )

  const clientProjects = selectedClientId ? projects.filter(p => p.clientId === selectedClientId || p.client?.id === selectedClientId) : projects

  const summaryCards = [
    { label: "Received", value: totalPaid, icon: CheckCircle, color: "bg-green-100 text-green-600", textColor: "text-green-600" },
    { label: "Pending", value: totalPending, icon: Clock, color: "bg-yellow-100 text-yellow-600", textColor: "text-yellow-600" },
    { label: "Overdue", value: totalOverdue, icon: AlertCircle, color: "bg-red-100 text-red-600", textColor: "text-red-600" },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title="Payments & Invoices" sub="Track all financial transactions">
        <Button variant="outline" size="sm" onClick={() => { setEditingInv(null); invForm.reset(); setInvOpen(true) }} className="gap-2 flex-1 sm:flex-none"><Plus className="w-4 h-4" /> Invoice</Button>
        <Button size="sm" onClick={openAddPay} className="gap-2 flex-1 sm:flex-none"><Plus className="w-4 h-4" /> Payment</Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, textColor }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-5 flex items-center gap-2 md:gap-4">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-sm md:text-xl font-heading font-bold truncate ${textColor}`}>{formatCurrency(value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="payments">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="payments" className="flex-1 sm:flex-none">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 sm:flex-none">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-4">
              <SearchBar value={search} onChange={setSearch} placeholder="Search payments..." />
              {loading ? <SkeletonRows count={4} /> : (
                <>
                  <div className="md:hidden space-y-3">
                    {filtered.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">No payments found</p>
                      : filtered.map(p => (
                        <div key={p.id} className="p-3 rounded-xl border border-border bg-background">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div><p className="font-medium text-sm">{p.client?.name}</p><p className="text-xs text-muted-foreground">{p.description || "—"}</p></div>
                            <AmountCell amount={p.amount} currency={clientCurrency(p.clientId)} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <StatusBadge status={p.status} colors={statusColors} />
                            <div className="flex gap-1">
                              {p.status === "PENDING" && <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => markPaid(p.id)}>Mark Paid</Button>}
                              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditPay(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500" onClick={() => deletePay(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Project</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filtered.length === 0
                          ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No payments found</TableCell></TableRow>
                          : filtered.map(p => (
                            <TableRow key={p.id}>
                              <TableCell><p className="font-medium text-sm">{p.client?.name}</p><p className="text-xs text-muted-foreground">{p.client?.company}</p></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{projects.find(pr => pr.id === p.projectId)?.name || "—"}</TableCell>
                              <TableCell className="text-sm">{p.description || "—"}</TableCell>
                              <TableCell><AmountCell amount={p.amount} currency={clientCurrency(p.clientId)} /></TableCell>
                              <TableCell><StatusBadge status={p.status} colors={statusColors} /></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : p.dueDate ? `Due ${formatDate(p.dueDate)}` : "—"}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  {p.status === "PENDING" && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => markPaid(p.id)}>Mark Paid</Button>}
                                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditPay(p)}><Pencil className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => deletePay(p.id)}><Trash2 className="w-4 h-4" /></Button>
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
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-4">
              {loading ? <SkeletonRows count={3} /> : (
                <>
                  <div className="md:hidden space-y-3">
                    {invoices.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">No invoices yet</p>
                      : invoices.map(inv => (
                        <div key={inv.id} className="p-3 rounded-xl border border-border bg-background">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div><p className="font-mono text-xs text-muted-foreground">{inv.invoiceNo}</p><p className="font-medium text-sm">{inv.client?.name}</p></div>
                            <AmountCell amount={inv.total} currency={clientCurrency(inv.clientId)} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <StatusBadge status={inv.status} colors={statusColors} />
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditInv(inv)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500" onClick={() => deleteInv(inv.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {invoices.length === 0
                          ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No invoices yet</TableCell></TableRow>
                          : invoices.map(inv => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-mono text-sm font-medium">{inv.invoiceNo}</TableCell>
                              <TableCell><p className="font-medium text-sm">{inv.client?.name}</p><p className="text-xs text-muted-foreground">{inv.client?.company}</p></TableCell>
                              <TableCell><AmountCell amount={inv.total} currency={clientCurrency(inv.clientId)} /></TableCell>
                              <TableCell><StatusBadge status={inv.status} colors={statusColors} /></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditInv(inv)}><Pencil className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => deleteInv(inv.id)}><Trash2 className="w-4 h-4" /></Button>
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
        </TabsContent>
      </Tabs>

      {/* Add/Edit Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">{editingPay ? "Edit Payment" : "Add Payment"}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editingPay ? "Update payment details" : "Record a new payment transaction"}</p>
          </DialogHeader>
          <form onSubmit={payForm.handleSubmit(onPaySubmit)}>
            <div className="px-6 py-5 space-y-5">

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Client <span className="text-red-500">*</span></Label>
                <Select
                  key={editingPay?.clientId ?? "new-pay"}
                  defaultValue={editingPay?.clientId}
                  onValueChange={v => { payForm.setValue("clientId", v); setSelectedClientId(v) }}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select a client…" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Project (optional)</Label>
                <Select
                  key={editingPay?.projectId ?? "new-proj"}
                  defaultValue={editingPay?.projectId}
                  onValueChange={v => payForm.setValue("projectId", v)}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder="Link to a project…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No project</SelectItem>
                    {clientProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border" />

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Amount</p>
                <div className="flex gap-2">
                  <Select defaultValue={editingPay?.currency || "INR"} onValueChange={v => payForm.setValue("currency", v)}>
                    <SelectTrigger className="w-24 h-10 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input {...payForm.register("amount", { required: true })} type="number" step="0.01" placeholder="1000.00" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Description</Label>
                  <Input {...payForm.register("description")} placeholder="e.g. Website development milestone" className="h-10" />
                </div>
              </div>

              <div className="border-t border-border" />

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Status & Due Date</p>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([{v:"PENDING",l:"Pending",a:"bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400 border-transparent"},{v:"PAID",l:"Paid",a:"bg-green-50 text-green-700 ring-2 ring-green-400 border-transparent"},{v:"OVERDUE",l:"Overdue",a:"bg-red-50 text-red-700 ring-2 ring-red-400 border-transparent"}]).map(opt => (
                      <button key={opt.v} type="button" onClick={() => { payForm.setValue("status", opt.v); setPayStatus(opt.v) }}
                        className={`py-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                          payStatus === opt.v ? opt.a : "border-border text-muted-foreground hover:bg-muted"
                        }`}>{opt.l}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Due Date</Label>
                  <Input {...payForm.register("dueDate")} type="date" className="h-10" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editingPay ? "Update Payment" : "Add Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={invOpen} onOpenChange={v => { setInvOpen(v); if (!v) setEditingInv(null) }}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-0.5">
            <DialogTitle className="text-base font-heading font-bold">{editingInv ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editingInv ? `Editing ${editingInv.invoiceNo}` : "Generate a new invoice for a client"}</p>
          </DialogHeader>
          <form onSubmit={invForm.handleSubmit(onInvSubmit)}>
            <div className="px-6 py-5 space-y-5">

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Client <span className="text-red-500">*</span></Label>
                <Select
                  key={editingInv?.clientId ?? "new-inv"}
                  defaultValue={editingInv?.clientId}
                  onValueChange={v => invForm.setValue("clientId", v)}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select a client…" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="border-t border-border" />

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Service & Amount</p>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Service Description <span className="text-red-500">*</span></Label>
                  <Input {...invForm.register("description", { required: true })} placeholder="e.g. Web Development Services" className="h-10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Amount <span className="text-red-500">*</span></Label>
                    <Input {...invForm.register("amount", { required: true })} type="number" step="0.01" placeholder="5000" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Tax (₹)</Label>
                    <Input {...invForm.register("tax")} type="number" step="0.01" placeholder="0" className="h-10" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Due Date</p>
                <Input {...invForm.register("dueDate")} type="date" className="h-10 mt-2" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2 justify-end bg-muted/20">
              <Button type="button" variant="outline" onClick={() => { setInvOpen(false); setEditingInv(null) }} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#ecc94b] hover:bg-[#d4a017] text-[#212529] font-semibold gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editingInv ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
