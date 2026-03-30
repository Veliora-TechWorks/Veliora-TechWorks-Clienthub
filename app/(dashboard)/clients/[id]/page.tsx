"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils"
import { ArrowLeft, Phone, Mail, Building2, Calendar, CheckCircle2, Circle } from "lucide-react"

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

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(d => { setClient(d); setLoading(false) })
  }, [id])

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
        <div>
          <h1 className="text-2xl font-heading font-bold">{client.name}</h1>
          <p className="text-muted-foreground text-sm">{client.company || "Individual Client"}</p>
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
          {client.projects?.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">No projects yet</CardContent></Card>
          ) : client.projects?.map((p: any) => (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.deadline && <p className="text-xs text-muted-foreground">Due {formatDate(p.deadline)}</p>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${projectStatusColors[p.status]}`}>{p.status.replace("_", " ")}</span>
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
    </div>
  )
}
