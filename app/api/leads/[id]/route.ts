import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { logActivity } from "@/lib/activity"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json()

  if (body.convertToClient) {
    const leadDoc = await db.collection("leads").doc(id).get()
    if (!leadDoc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const lead = leadDoc.data()!
    const clientId = uuidv4()
    await db.collection("clients").doc(clientId).set({
      name: lead.name, email: lead.email || "", phone: lead.phone || "",
      company: lead.company || "", status: "active",
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    })
    await db.collection("leads").doc(id).update({ status: "CONVERTED", updatedAt: FieldValue.serverTimestamp() })
    await logActivity("converted", "lead", id, `Lead ${lead.name} converted to client`, session!.user.id)
    return NextResponse.json({ client: { id: clientId } })
  }

  await db.collection("leads").doc(id).update({ ...body, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...body })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  await db.collection("leads").doc(id).delete()
  return NextResponse.json({ success: true })
}
