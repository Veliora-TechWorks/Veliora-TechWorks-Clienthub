"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, SearchBar, SkeletonRows, StatusBadge, SaveButton } from "@/components/ui/shared"
import { toast } from "@/hooks/use-toast"
import { formatCurrency, formatCurrencyIntl, formatDate, CURRENCIES } from "@/lib/utils"
import { Plus, Download, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react"

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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [payOpen, setPayOpen] = useState(false)
  const [invOpen, setInvOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const payForm = useForm<any>()
  const invForm = useForm<any>()

  const load = () => {
    setLoading(true)
    Promise.all([fetch("/api/payments").then(r => r.json()), fetch("/api/invoices").then(r => r.json()), fetch("/api/clients").then(r => r.json())])
      .then(([p, inv, c]) => { setPayments(p); setInvoices(inv); setClients(c); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const clientCurrency = (id: string) => clients.find(c => c.id === id)?.currency || "INR"
  const totalPaid = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0)
  const totalOverdue = payments.filter(p => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0)

  const onPaySubmit = async (data: any) => {
    setSaving(true)
    await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    setSaving(false); toast({ title: "Payment added" }); setPayOpen(false); payForm.reset(); load()
  }

  const onInvSubmit = async (data: any) => {
    setSaving(true)
    const amount = parseFloat(data.amount), tax = parseFloat(data.tax || "0")
    await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: data.clientId, items: [{ description: data.description, quantity: 1, rate: amount, amount }], subtotal: amount, tax, total: amount + tax, dueDate: data.dueDate || null }),
    })
    setSaving(false); toast({ title: "Invoice created" }); setInvOpen(false); invForm.reset(); load()
  }

  const markPaid = async (id: string) => {
    await fetch(`/api/payments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }) })
    toast({ title: "Marked as paid" }); load()
  }

  const filtered = payments.filter(p =>
    (p.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  )

  const summaryCards = [
    { label: "Received", value: totalPaid, icon: CheckCircle, color: "bg-green-100 text-green-600", textColor: "text-green-600" },
    { label: "Pending", value: totalPending, icon: Clock, color: "bg-yellow-100 text-yellow-600", textColor: "text-yellow-600" },
    { label: "Overdue", value: totalOverdue, icon: AlertCircle, color: "bg-red-100 text-red-600", textColor: "text-red-600" },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title="Payments & Invoices" sub="Track all financial transactions">
        <Button variant="outline" size="sm" onClick={() => setInvOpen(true)} className="gap-2 flex-1 sm:flex-none"><Plus className="w-4 h-4" /> Invoice</Button>
        <Button size="sm" onClick={() => setPayOpen(true)} className="gap-2 flex-1 sm:flex-none"><Plus className="w-4 h-4" /> Payment</Button>
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
                            {p.status === "PENDING" && <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => markPaid(p.id)}>Mark Paid</Button>}
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filtered.length === 0
                          ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No payments found</TableCell></TableRow>
                          : filtered.map(p => (
                            <TableRow key={p.id}>
                              <TableCell><p className="font-medium text-sm">{p.client?.name}</p><p className="text-xs text-muted-foreground">{p.client?.company}</p></TableCell>
                              <TableCell className="text-sm">{p.description || "—"}</TableCell>
                              <TableCell><AmountCell amount={p.amount} currency={clientCurrency(p.clientId)} /></TableCell>
                              <TableCell><StatusBadge status={p.status} colors={statusColors} /></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : p.dueDate ? `Due ${formatDate(p.dueDate)}` : "—"}</TableCell>
                              <TableCell><div className="flex justify-end">{p.status === "PENDING" && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => markPaid(p.id)}>Mark Paid</Button>}</div></TableCell>
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
                            <Button variant="ghost" size="icon" className="w-7 h-7"><Download className="w-3.5 h-3.5" /></Button>
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
                              <TableCell><div className="flex justify-end"><Button variant="ghost" size="icon" className="w-8 h-8"><Download className="w-4 h-4" /></Button></div></TableCell>
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

      {/* Add Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
          <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select onValueChange={v => payForm.setValue("clientId", v)}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <div className="flex gap-2">
                <Select defaultValue="INR" onValueChange={v => payForm.setValue("currency", v)}><SelectTrigger className="w-28 shrink-0"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select>
                <Input {...payForm.register("amount", { required: true })} type="number" step="0.01" placeholder="1000.00" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input {...payForm.register("description")} placeholder="Payment description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select defaultValue="PENDING" onValueChange={v => payForm.setValue("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="PAID">Paid</SelectItem><SelectItem value="OVERDUE">Overdue</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input {...payForm.register("dueDate")} type="date" /></div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <SaveButton saving={saving} label="Add" />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={invOpen} onOpenChange={setInvOpen}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <form onSubmit={invForm.handleSubmit(onInvSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select onValueChange={v => invForm.setValue("clientId", v)}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Service Description *</Label><Input {...invForm.register("description", { required: true })} placeholder="Web Development Services" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount *</Label><Input {...invForm.register("amount", { required: true })} type="number" step="0.01" placeholder="5000" /></div>
              <div className="space-y-1.5"><Label>Tax (₹)</Label><Input {...invForm.register("tax")} type="number" step="0.01" placeholder="0" /></div>
            </div>
            <div className="space-y-1.5"><Label>Due Date</Label><Input {...invForm.register("dueDate")} type="date" /></div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setInvOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <SaveButton saving={saving} label="Create Invoice" />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
