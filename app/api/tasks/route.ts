import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  let query: FirebaseFirestore.Query = db.collection("tasks").orderBy("createdAt", "desc")
  if (projectId) query = db.collection("tasks").where("projectId", "==", projectId).orderBy("createdAt", "desc")
  const snap = await query.get()
  const tasks = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data()
      const projectDoc = await db.collection("projects").doc(data.projectId).get()
      let client = null
      if (projectDoc.exists) {
        const clientDoc = await db.collection("clients").doc(projectDoc.data()!.clientId).get()
        client = clientDoc.exists ? { name: clientDoc.data()!.name } : null
      }
      return { id: doc.id, ...data, project: projectDoc.exists ? { name: projectDoc.data()!.name, client } : null }
    })
  )
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("tasks").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...body }, { status: 201 })
}
