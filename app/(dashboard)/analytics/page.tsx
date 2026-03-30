"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, Users, Target, FolderKanban } from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const COLORS = ["#ecc94b", "#f97316", "#3b82f6", "#10b981", "#ef4444"]

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="space-y-4 md:space-y-6">
      <div className="h-8 animate-pulse bg-muted rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-20 bg-muted rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-64 bg-muted rounded-2xl" />)}
      </div>
    </div>
  )

  const projectStatusData = data?.projectStats?.map((p: any) => ({
    name: p.status.replace("_", " "),
    value: p._count,
  })) || []

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Business performance overview</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: TrendingUp, color: "bg-[#ecc94b]/20 text-[#b7950b]", label: "Total Revenue", value: formatCurrency(data?.revenueByMonth?.reduce((s: number, m: any) => s + m.revenue, 0) || 0) },
          { icon: Users, color: "bg-blue-100 text-blue-600", label: "New Clients (6mo)", value: data?.clientGrowth?.reduce((s: number, m: any) => s + m.count, 0) || 0 },
          { icon: Target, color: "bg-green-100 text-green-600", label: "Lead Conv. Rate", value: `${data?.leadConversion?.rate || 0}%` },
          { icon: FolderKanban, color: "bg-purple-100 text-purple-600", label: "Total Leads", value: data?.leadConversion?.total || 0 },
        ].map(({ icon: Icon, color, label, value }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-5">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                  <p className="text-sm md:text-lg font-heading font-bold truncate">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base">Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.revenueByMonth || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ecc94b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ecc94b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={50} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#ecc94b" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base">Client Growth (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.clientGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} name="New Clients" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {projectStatusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base">Top Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="space-y-3">
              {data?.topClients?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No data yet</p>
              ) : data?.topClients?.map((tc: any, i: number) => (
                <div key={tc.clientId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ecc94b]/20 text-[#b7950b] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tc.client?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{tc.client?.company}</p>
                  </div>
                  <span className="font-heading font-bold text-sm shrink-0">{formatCurrency(tc._sum.amount || 0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
