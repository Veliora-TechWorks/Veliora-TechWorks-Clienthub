import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  const snap = await db.collection("callLogs").orderBy("date", "desc").get()
  const calls = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data()
      const clientDoc = await db.collection("clients").doc(data.clientId).get()
      return { id: doc.id, ...data, client: clientDoc.exists ? { name: clientDoc.data()!.name, company: clientDoc.data()!.company } : null }
    })
  )
  return NextResponse.json(calls)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("callLogs").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp() })
  const clientDoc = await db.collection("clients").doc(body.clientId).get()
  const clientName = clientDoc.data()?.name || "Unknown"
  await logActivity("logged", "call", id, `Call logged for ${clientName}`, session!.user.id)
  return NextResponse.json({ id, ...body }, { status: 201 })
}
