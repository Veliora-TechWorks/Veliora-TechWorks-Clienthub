import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [paymentsSnap, clientsSnap, leadsSnap, projectsSnap] = await Promise.all([
    db.collection("payments").where("status", "==", "PAID").get(),
    db.collection("clients").where("createdAt", ">=", sixMonthsAgo).get(),
    db.collection("leads").get(),
    db.collection("projects").get(),
  ])

  // Monthly revenue
  const months: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months[d.toLocaleString("default", { month: "short", year: "2-digit" })] = 0
  }
  paymentsSnap.docs.forEach((doc) => {
    const data = doc.data()
    if (!data.paidAt) return
    const paidAt = data.paidAt.toDate ? data.paidAt.toDate() : new Date(data.paidAt)
    if (paidAt < sixMonthsAgo) return
    const key = paidAt.toLocaleString("default", { month: "short", year: "2-digit" })
    if (key in months) months[key] += data.amount
  })

  // Client growth monthly
  const clientMonths: Record<string, number> = { ...Object.fromEntries(Object.keys(months).map((k) => [k, 0])) }
  clientsSnap.docs.forEach((doc) => {
    const data = doc.data()
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    const key = createdAt.toLocaleString("default", { month: "short", year: "2-digit" })
    if (key in clientMonths) clientMonths[key]++
  })

  // Lead conversion by status
  const leadsByStatus: Record<string, number> = {}
  leadsSnap.docs.forEach((doc) => {
    const status = doc.data().status || "NEW"
    leadsByStatus[status] = (leadsByStatus[status] || 0) + 1
  })
  const totalLeads = leadsSnap.size
  const converted = leadsByStatus["CONVERTED"] || 0

  // Project stats by status
  const projectsByStatus: Record<string, number> = {}
  projectsSnap.docs.forEach((doc) => {
    const status = doc.data().status || "ONBOARDING"
    projectsByStatus[status] = (projectsByStatus[status] || 0) + 1
  })

  // Top clients by revenue
  const clientRevenue: Record<string, number> = {}
  paymentsSnap.docs.forEach((doc) => {
    const { clientId, amount } = doc.data()
    clientRevenue[clientId] = (clientRevenue[clientId] || 0) + amount
  })
  const topClientIds = Object.entries(clientRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)
  const topClients = await Promise.all(
    topClientIds.map(async (id) => {
      const doc = await db.collection("clients").doc(id).get()
      return { clientId: id, _sum: { amount: clientRevenue[id] }, client: doc.exists ? { name: doc.data()!.name, company: doc.data()!.company } : null }
    })
  )

  return NextResponse.json({
    revenueByMonth: Object.entries(months).map(([month, revenue]) => ({ month, revenue })),
    clientGrowth: Object.entries(clientMonths).map(([month, count]) => ({ month, count })),
    leadConversion: {
      total: totalLeads, converted,
      rate: totalLeads ? Math.round((converted / totalLeads) * 100) : 0,
      byStatus: Object.entries(leadsByStatus).map(([status, _count]) => ({ status, _count })),
    },
    projectStats: Object.entries(projectsByStatus).map(([status, _count]) => ({ status, _count })),
    topClients,
  })
}
