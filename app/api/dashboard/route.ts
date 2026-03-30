import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth, cachedResponse } from "@/lib/api-helpers"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)

  // All queries in parallel
  const [clientsSnap, projectsSnap, paymentsSnap, leadsSnap, activitySnap] = await Promise.all([
    db.collection("clients").get(),
    db.collection("projects").get(),
    db.collection("payments").where("status", "==", "PAID").get(),
    db.collection("leads").get(),
    db.collection("activityLogs").orderBy("createdAt", "desc").limit(10).get(),
  ])

  const totalRevenue = paymentsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)

  // Projects by status
  const projectsByStatus: Record<string, number> = {}
  projectsSnap.docs.forEach(doc => {
    const s = doc.data().status || "ONBOARDING"
    projectsByStatus[s] = (projectsByStatus[s] || 0) + 1
  })

  // Leads by status
  const leadsByStatus: Record<string, number> = {}
  leadsSnap.docs.forEach(doc => {
    const s = doc.data().status || "NEW"
    leadsByStatus[s] = (leadsByStatus[s] || 0) + 1
  })

  // Monthly revenue
  const monthlyRevenue: Record<string, number> = {}
  paymentsSnap.docs.forEach(doc => {
    const data = doc.data()
    const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    if (date < sixMonthsAgo) return
    const key = date.toISOString().slice(0, 7)
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + data.amount
  })

  // Batch fetch unique users instead of one-per-activity
  const userIds = [...new Set(activitySnap.docs.map(d => d.data().userId).filter(Boolean))]
  const userMap: Record<string, string> = {}
  if (userIds.length > 0) {
    await Promise.all(
      userIds.map(async uid => {
        const userDoc = await db.collection("users").doc(uid).get()
        if (userDoc.exists) userMap[uid] = userDoc.data()!.name
      })
    )
  }

  const recentActivity = activitySnap.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      user: data.userId && userMap[data.userId] ? { name: userMap[data.userId] } : null,
    }
  })

  return cachedResponse({
    kpis: {
      totalClients: clientsSnap.size,
      totalProjects: projectsSnap.size,
      totalRevenue,
      totalLeads: leadsSnap.size,
    },
    recentActivity,
    projectsByStatus: Object.entries(projectsByStatus).map(([status, _count]) => ({ status, _count })),
    leadsByStatus: Object.entries(leadsByStatus).map(([status, _count]) => ({ status, _count })),
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, revenue: amount })),
  }, 30)
}
