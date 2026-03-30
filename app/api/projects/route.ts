import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  const snap = await db.collection("projects").orderBy("createdAt", "desc").get()
  const projects = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data()
      const [clientDoc, tasks, onboarding] = await Promise.all([
        db.collection("clients").doc(data.clientId).get(),
        db.collection("tasks").where("projectId", "==", doc.id).get(),
        db.collection("onboardingChecklists").where("projectId", "==", doc.id).limit(1).get(),
      ])
      return {
        id: doc.id, ...data,
        client: clientDoc.exists ? { name: clientDoc.data()!.name, company: clientDoc.data()!.company } : null,
        tasks: tasks.docs.map((t) => ({ id: t.id, ...t.data() })),
        onboarding: onboarding.empty ? null : { id: onboarding.docs[0].id, ...onboarding.docs[0].data() },
      }
    })
  )
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("projects").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  await db.collection("onboardingChecklists").add({
    projectId: id, requirements: false, payment: false, kickoff: false,
    accessGranted: false, contractSigned: false,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  })
  await logActivity("created", "project", id, `Project ${body.name} created`, session!.user.id)
  return NextResponse.json({ id, ...body }, { status: 201 })
}
