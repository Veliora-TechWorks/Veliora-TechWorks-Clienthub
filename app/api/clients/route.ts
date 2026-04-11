import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth, cachedResponse } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

function s(data: FirebaseFirestore.DocumentData): any {
  const out: any = {}
  for (const [k, v] of Object.entries(data))
    out[k] = v && typeof v.toDate === "function" ? v.toDate().toISOString() : v
  return out
}

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const [clientsSnap, projectsSnap, paymentsSnap] = await Promise.all([
    db.collection("clients").orderBy("createdAt", "desc").get(),
    db.collection("projects").get(),
    db.collection("payments").get(),
  ])

  const projectsByClient: Record<string, any[]> = {}
  const seenProjects = new Set<string>()
  projectsSnap.docs.forEach(d => {
    if (seenProjects.has(d.id)) return
    seenProjects.add(d.id)
    const cid = d.data().clientId
    if (!projectsByClient[cid]) projectsByClient[cid] = []
    projectsByClient[cid].push({ id: d.id, ...s(d.data()) })
  })

  const paymentsByClient: Record<string, any[]> = {}
  const seenPayments = new Set<string>()
  paymentsSnap.docs.forEach(d => {
    if (seenPayments.has(d.id)) return
    seenPayments.add(d.id)
    const cid = d.data().clientId
    if (!paymentsByClient[cid]) paymentsByClient[cid] = []
    paymentsByClient[cid].push({ id: d.id, ...s(d.data()) })
  })

  const seenClients = new Set<string>()
  const clients = clientsSnap.docs
    .filter(doc => { if (seenClients.has(doc.id)) return false; seenClients.add(doc.id); return true })
    .map(doc => ({
      id: doc.id,
      ...s(doc.data()),
      projects: projectsByClient[doc.id] || [],
      payments: paymentsByClient[doc.id] || [],
    }))

  return cachedResponse(clients, 20)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("clients").doc(id).set({
    ...body,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  await logActivity("created", "client", id, `New client ${body.name} added`, session!.user.id)
  return NextResponse.json({ id, ...body }, { status: 201 })
}
