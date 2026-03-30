import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth, cachedResponse } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  // 3 parallel queries instead of 2N+1
  const [clientsSnap, projectsSnap, paymentsSnap] = await Promise.all([
    db.collection("clients").orderBy("createdAt", "desc").get(),
    db.collection("projects").get(),
    db.collection("payments").get(),
  ])

  // Build lookup maps — O(n) instead of O(n²)
  const projectsByClient: Record<string, any[]> = {}
  projectsSnap.docs.forEach(d => {
    const cid = d.data().clientId
    if (!projectsByClient[cid]) projectsByClient[cid] = []
    projectsByClient[cid].push({ id: d.id, ...d.data() })
  })

  const paymentsByClient: Record<string, any[]> = {}
  paymentsSnap.docs.forEach(d => {
    const cid = d.data().clientId
    if (!paymentsByClient[cid]) paymentsByClient[cid] = []
    paymentsByClient[cid].push({ id: d.id, ...d.data() })
  })

  const clients = clientsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
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
