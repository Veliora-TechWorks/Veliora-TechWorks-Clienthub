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

async function generateProjectId(): Promise<string> {
  const snap = await db.collection("projects").orderBy("createdAt", "desc").limit(1).get()
  if (snap.empty) return "PROJ-001"
  const last = snap.docs[0].data().projectId as string | undefined
  if (!last || !last.startsWith("PROJ-")) return "PROJ-001"
  return `PROJ-${String(parseInt(last.replace("PROJ-", ""), 10) + 1).padStart(3, "0")}`
}

function progressToStatus(p: number): string {
  if (p <= 20) return "ONBOARDING"
  if (p <= 80) return "IN_PROGRESS"
  if (p < 100) return "PENDING"
  return "COMPLETED"
}

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const snap = await db.collection("projects").orderBy("createdAt", "desc").get()
  // Use Map for O(1) dedup — first occurrence wins
  const seen = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>()
  snap.docs.forEach(d => { if (!seen.has(d.id)) seen.set(d.id, d) })
  const docs = [...seen.values()]

  const clientIds = [...new Set(docs.map(d => d.data().clientId).filter(Boolean))]
  const clientMap: Record<string, any> = {}
  if (clientIds.length > 0) {
    const refs = clientIds.map(id => db.collection("clients").doc(id))
    const cdocs = await db.getAll(...refs)
    cdocs.forEach(c => { if (c.exists) clientMap[c.id] = { id: c.id, name: c.data()!.name, company: c.data()!.company } })
  }

  return NextResponse.json(
    docs.map(doc => ({ id: doc.id, ...s(doc.data()), client: clientMap[doc.data().clientId] || null }))
  )
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  const projectId = await generateProjectId()
  const progress = Number(body.progress ?? 0)
  const data = {
    projectId, name: body.name, clientId: body.clientId,
    link: body.link || "", startDate: body.startDate || null, endDate: body.endDate || null,
    priority: body.priority || "MEDIUM", status: body.status || progressToStatus(progress),
    progress, remarks: body.remarks || "",
    remarksHistory: body.remarks ? [{ text: body.remarks, updatedAt: new Date().toISOString(), updatedBy: session!.user.name || "User" }] : [],
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  }
  await db.collection("projects").doc(id).set(data)
  await logActivity("created", "project", id, `Project ${body.name} (${projectId}) created`, session!.user.id)
  return NextResponse.json({ id, ...data }, { status: 201 })
}
