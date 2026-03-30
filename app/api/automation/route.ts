import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  const snap = await db.collection("automationRules").orderBy("createdAt", "desc").get()
  return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("automationRules").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...body }, { status: 201 })
}
