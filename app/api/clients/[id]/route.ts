import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const doc = await db.collection("clients").doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [projectsSnap, paymentsSnap, callsSnap, invoicesSnap] = await Promise.all([
    db.collection("projects").where("clientId", "==", id).get(),
    db.collection("payments").where("clientId", "==", id).orderBy("createdAt", "desc").get(),
    db.collection("callLogs").where("clientId", "==", id).orderBy("date", "desc").get(),
    db.collection("invoices").where("clientId", "==", id).orderBy("createdAt", "desc").get(),
  ])

  const projects = await Promise.all(
    projectsSnap.docs.map(async (p) => {
      const [tasks, onboarding] = await Promise.all([
        db.collection("tasks").where("projectId", "==", p.id).get(),
        db.collection("onboardingChecklists").where("projectId", "==", p.id).limit(1).get(),
      ])
      return {
        id: p.id, ...p.data(),
        tasks: tasks.docs.map((t) => ({ id: t.id, ...t.data() })),
        onboarding: onboarding.empty ? null : { id: onboarding.docs[0].id, ...onboarding.docs[0].data() },
      }
    })
  )

  return NextResponse.json({
    id: doc.id, ...doc.data(),
    projects,
    payments: paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    callLogs: callsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    invoices: invoicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
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
