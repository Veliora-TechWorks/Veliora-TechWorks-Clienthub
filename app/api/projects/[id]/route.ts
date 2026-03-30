import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const doc = await db.collection("projects").doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const data = doc.data()!
  const [clientDoc, tasks, onboarding, files] = await Promise.all([
    db.collection("clients").doc(data.clientId).get(),
    db.collection("tasks").where("projectId", "==", id).orderBy("createdAt", "desc").get(),
    db.collection("onboardingChecklists").where("projectId", "==", id).limit(1).get(),
    db.collection("projectFiles").where("projectId", "==", id).get(),
  ])
  return NextResponse.json({
    id: doc.id, ...data,
    client: clientDoc.exists ? { id: clientDoc.id, ...clientDoc.data() } : null,
    tasks: tasks.docs.map((t) => ({ id: t.id, ...t.data() })),
    onboarding: onboarding.empty ? null : { id: onboarding.docs[0].id, ...onboarding.docs[0].data() },
    files: files.docs.map((f) => ({ id: f.id, ...f.data() })),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  await db.collection("projects").doc(id).update({ ...body, updatedAt: FieldValue.serverTimestamp() })
  await logActivity("updated", "project", id, `Project ${body.name} updated`, session!.user.id)
  return NextResponse.json({ id, ...body })
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
