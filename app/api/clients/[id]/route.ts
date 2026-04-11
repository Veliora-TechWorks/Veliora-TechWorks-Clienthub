import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"

function serializeDoc(data: FirebaseFirestore.DocumentData): any {
  const out: any = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v.toDate === "function") out[k] = v.toDate().toISOString()
    else out[k] = v
  }
  return out
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params

  const doc = await db.collection("clients").doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Fetch all related data in parallel — no orderBy to avoid missing index errors
  const [projectsSnap, paymentsSnap, callsSnap, invoicesSnap] = await Promise.all([
    db.collection("projects").where("clientId", "==", id).get(),
    db.collection("payments").where("clientId", "==", id).get(),
    db.collection("callLogs").where("clientId", "==", id).get(),
    db.collection("invoices").where("clientId", "==", id).get(),
  ])

  // Batch-fetch all tasks for all projects in one call
  const projectIds = projectsSnap.docs.map(p => p.id)
  let tasksByProject: Record<string, any[]> = {}
  if (projectIds.length > 0) {
    // Firestore "in" query supports up to 30 items
    const chunks = []
    for (let i = 0; i < projectIds.length; i += 30) chunks.push(projectIds.slice(i, i + 30))
    for (const chunk of chunks) {
      const tasksSnap = await db.collection("tasks").where("projectId", "in", chunk).get()
      tasksSnap.docs.forEach(t => {
        const pid = t.data().projectId
        if (!tasksByProject[pid]) tasksByProject[pid] = []
        tasksByProject[pid].push({ id: t.id, ...serializeDoc(t.data()) })
      })
    }
  }

  const projects = projectsSnap.docs.map(p => ({
    id: p.id,
    ...serializeDoc(p.data()),
    tasks: tasksByProject[p.id] || [],
  })).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

  const payments = paymentsSnap.docs
    .map(d => ({ id: d.id, ...serializeDoc(d.data()) }))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

  const callLogs = callsSnap.docs
    .map(d => ({ id: d.id, ...serializeDoc(d.data()) }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))

  const invoices = invoicesSnap.docs
    .map(d => ({ id: d.id, ...serializeDoc(d.data()) }))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

  return NextResponse.json({
    id: doc.id,
    ...serializeDoc(doc.data()!),
    projects,
    payments,
    callLogs,
    invoices,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  await db.collection("clients").doc(id).update({ ...body, updatedAt: FieldValue.serverTimestamp() })
  await logActivity("updated", "client", id, `Client ${body.name} updated`, session!.user.id)
  return NextResponse.json({ id, ...body })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  if (error) return error
  const { id } = await params
  const doc = await db.collection("clients").doc(id).get()
  const name = doc.data()?.name
  await db.collection("clients").doc(id).delete()
  await logActivity("deleted", "client", id, `Client ${name} deleted`, session!.user.id)
  return NextResponse.json({ success: true })
}
