import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { FieldValue } from "firebase-admin/firestore"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const doc = await db.collection("invoices").doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const data = doc.data()!
  const clientDoc = await db.collection("clients").doc(data.clientId).get()
  return NextResponse.json({ id: doc.id, ...data, client: clientDoc.exists ? { id: clientDoc.id, ...clientDoc.data() } : null })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  await db.collection("invoices").doc(id).update({ ...body, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...body })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  await db.collection("invoices").doc(id).delete()
  return NextResponse.json({ success: true })
}
