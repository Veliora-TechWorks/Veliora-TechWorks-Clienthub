import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"

function progressToStatus(progress: number): string {
  if (progress <= 20) return "ONBOARDING"
  if (progress <= 80) return "IN_PROGRESS"
  if (progress < 100) return "PENDING"
  return "COMPLETED"
}

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
  try {
    const doc = await db.collection("projects").doc(id).get()
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const data = doc.data()!
    const [clientDoc, tasks] = await Promise.all([
      data.clientId ? db.collection("clients").doc(data.clientId).get() : Promise.resolve(null),
      db.collection("tasks").where("projectId", "==", id).get(),
    ])
    return NextResponse.json({
      id: doc.id, ...serializeDoc(data),
      client: clientDoc?.exists ? { id: clientDoc.id, ...serializeDoc(clientDoc.data()!) } : null,
      tasks: tasks.docs.map((t) => ({ id: t.id, ...serializeDoc(t.data()) })),
    })
  } catch (err) {
    console.error("GET /api/projects/[id]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json()

  const existing = await db.collection("projects").doc(id).get()
  const existingData = existing.data() || {}

  const updates: Record<string, any> = { ...body, updatedAt: FieldValue.serverTimestamp() }

  // Auto-update status from progress if progress changed
  if (body.progress !== undefined) {
    updates.status = body.status || progressToStatus(Number(body.progress))
  }

  // Append to remarks history if remarks changed
  if (body.remarks && body.remarks !== existingData.remarks) {
    updates.remarksHistory = FieldValue.arrayUnion({
      text: body.remarks,
      updatedAt: new Date().toISOString(),
      updatedBy: session!.user.name || "User",
    })
  }

  await db.collection("projects").doc(id).update(updates)
  await logActivity("updated", "project", id, `Project ${body.name || existingData.name} updated`, session!.user.id)
  return NextResponse.json({ id, ...updates })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  if (error) return error
  const { id } = await params
  const doc = await db.collection("projects").doc(id).get()
  const name = doc.data()?.name
  await db.collection("projects").doc(id).delete()
  await logActivity("deleted", "project", id, `Project ${name} deleted`, session!.user.id)
  return NextResponse.json({ success: true })
}
