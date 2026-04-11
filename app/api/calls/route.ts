import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
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

  const snap = await db.collection("callLogs").orderBy("date", "desc").get()
  if (snap.empty) return NextResponse.json([])

  const clientIds = [...new Set(snap.docs.map(d => d.data().clientId).filter(Boolean))]
  const clientMap: Record<string, any> = {}
  if (clientIds.length > 0) {
    const cdocs = await db.getAll(...clientIds.map(id => db.collection("clients").doc(id)))
    cdocs.forEach(c => { if (c.exists) clientMap[c.id] = { name: c.data()!.name, company: c.data()!.company } })
  }

  return NextResponse.json(
    snap.docs.map(doc => ({ id: doc.id, ...s(doc.data()), client: clientMap[doc.data().clientId] || null }))
  )
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("callLogs").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp() })
  const clientDoc = await db.collection("clients").doc(body.clientId).get()
  const clientName = clientDoc.data()?.name || "Unknown"
  logActivity("logged", "call", id, `Call logged for ${clientName}`, session!.user.id)
  return NextResponse.json({ id, ...body }, { status: 201 })
}
