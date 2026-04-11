import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

function s(data: FirebaseFirestore.DocumentData): any {
  const out: any = {}
  for (const [k, v] of Object.entries(data))
    out[k] = v && typeof v.toDate === "function" ? v.toDate().toISOString() : v
  return out
}

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  try {
    const snap = await db.collection("automationRules").orderBy("createdAt", "desc").get()
    return NextResponse.json(snap.docs.map(d => ({ id: d.id, ...s(d.data()) })))
  } catch {
    const snap = await db.collection("automationRules").get()
    return NextResponse.json(snap.docs.map(d => ({ id: d.id, ...s(d.data()) })))
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("automationRules").doc(id).set({
    ...body,
    active: body.active ?? true,
    runCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ id, ...body }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await db.collection("automationRules").doc(id).update({ ...updates, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...updates })
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await db.collection("automationRules").doc(id).delete()
  return NextResponse.json({ success: true })
}
