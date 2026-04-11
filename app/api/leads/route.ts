import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  try {
    const snap = await db.collection("leads").orderBy("createdAt", "desc").get()
    return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  } catch {
    const snap = await db.collection("leads").get()
    return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("leads").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  await logActivity("created", "lead", id, `New lead ${body.name} added`, session!.user.id)
  return NextResponse.json({ id, ...body }, { status: 201 })
}
