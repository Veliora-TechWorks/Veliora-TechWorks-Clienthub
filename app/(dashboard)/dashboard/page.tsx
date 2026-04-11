"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FolderKanban, DollarSign, UserPlus, TrendingUp, Activity } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface DashboardData {
  kpis: { totalClients: number; totalProjects: number; totalRevenue: number; totalLeads: number }
  recentActivity: Array<{ id: string; action: string; entity: string; details: string; createdAt: string; user?: { name: string } }>
  projectsByStatus: Array<{ status: string; _count: number }>
  leadsByStatus: Array<{ status: string; _count: number }>
}

function KpiCard({ title, value, icon: Icon, color, sub, href }: { title: string; value: string; icon: any; color: string; sub?: string; href?: string }) {
  const router = useRouter()
  return (
    <Card
      className={`border-0 shadow-sm hover:shadow-md transition-shadow ${href ? "cursor-pointer" : ""}`}
      onClick={() => href && router.push(href)}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl md:text-3xl font-heading font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

const actionColors: Record<string, string> = {
  created: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
  payment_received: "bg-yellow-100 text-yellow-700",
  logged: "bg-gray-100 text-gray-700",
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  const chartData = data?.projectsByStatus.map((p) => ({
    name: p.status.replace("_", " "),
    value: p._count,
  })) || []

  const leadData = data?.leadsByStatus.map((l) => ({
    name: l.status,
    value: l._count,
  })) || []

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to Veliora ClientHub</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard title="Total Clients" value={String(data?.kpis.totalClients || 0)} icon={Users} color="bg-[#ecc94b]/20 text-[#b7950b]" sub="Active accounts" href="/clients" />
            <KpiCard title="Total Revenue" value={formatCurrency(data?.kpis.totalRevenue || 0)} icon={DollarSign} color="bg-green-100 text-green-700" sub="Payments received" href="/payments" />
            <KpiCard title="Projects" value={String(data?.kpis.totalProjects || 0)} icon={FolderKanban} color="bg-blue-100 text-blue-700" sub="All projects" href="/projects" />
            <KpiCard title="Leads" value={String(data?.kpis.totalLeads || 0)} icon={UserPlus} color="bg-orange-100 text-orange-700" sub="In pipeline" href="/leads" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#ecc94b]" /> Projects by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            {loading ? (
              <div className="h-40 md:h-48 animate-pulse bg-muted rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ecc94b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#f97316]" /> Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            {loading ? (
              <div className="h-40 md:h-48 animate-pulse bg-muted rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={leadData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 md:px-6">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#ecc94b]" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3 items-center">
                  <div className="w-16 h-5 bg-muted rounded-full" />
                  <div className="h-4 bg-muted rounded flex-1" />
                  <div className="w-20 h-4 bg-muted rounded hidden sm:block" />
                </div>
              ))}
            </div>
          ) : data?.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {data?.recentActivity.map((log) => (
                <div key={log.id} className="flex items-start sm:items-center gap-2 sm:gap-3 py-2 border-b border-border last:border-0">
                  <Badge className={`text-xs shrink-0 ${actionColors[log.action] || "bg-gray-100 text-gray-700"}`} variant="outline">
                    {log.action}
                  </Badge>
                  <p className="text-xs sm:text-sm flex-1 text-foreground leading-snug">{log.details}</p>
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDateTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
