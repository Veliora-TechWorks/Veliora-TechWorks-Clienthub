import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { FieldValue } from "firebase-admin/firestore"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  await db.collection("tasks").doc(id).update({ ...body, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...body })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  await db.collection("tasks").doc(id).delete()
  return NextResponse.json({ success: true })
}
