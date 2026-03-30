import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  await db.collection("payments").doc(id).update({ ...body, updatedAt: FieldValue.serverTimestamp() })
  await logActivity("updated", "payment", id, `Payment status updated to ${body.status}`, session!.user.id)
  return NextResponse.json({ id, ...body })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  await db.collection("payments").doc(id).delete()
  return NextResponse.json({ success: true })
}
