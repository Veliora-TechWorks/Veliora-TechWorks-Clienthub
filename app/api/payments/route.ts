import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  const snap = await db.collection("payments").orderBy("createdAt", "desc").get()
  const payments = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data()
      const clientDoc = await db.collection("clients").doc(data.clientId).get()
      return { id: doc.id, ...data, client: clientDoc.exists ? { name: clientDoc.data()!.name, company: clientDoc.data()!.company } : null }
    })
  )
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("payments").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  await logActivity("created", "payment", id, `Payment of $${body.amount} created`, session!.user.id)
  return NextResponse.json({ id, ...body }, { status: 201 })
}
