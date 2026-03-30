import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"
import { FieldValue } from "firebase-admin/firestore"
import { generateInvoiceNo } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  const snap = await db.collection("invoices").orderBy("createdAt", "desc").get()
  const invoices = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data()
      const clientDoc = await db.collection("clients").doc(data.clientId).get()
      return { id: doc.id, ...data, client: clientDoc.exists ? { name: clientDoc.data()!.name, company: clientDoc.data()!.company, email: clientDoc.data()!.email } : null }
    })
  )
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("invoices").doc(id).set({ ...body, invoiceNo: generateInvoiceNo(), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...body }, { status: 201 })
}
