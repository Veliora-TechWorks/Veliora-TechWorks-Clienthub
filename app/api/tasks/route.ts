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

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  const snap = projectId
    ? await db.collection("tasks").where("projectId", "==", projectId).orderBy("createdAt", "desc").get()
    : await db.collection("tasks").orderBy("createdAt", "desc").get()

  if (snap.empty) return NextResponse.json([])

  const projectIds = [...new Set(snap.docs.map(d => d.data().projectId).filter(Boolean))]
  const projectMap: Record<string, any> = {}
  if (projectIds.length > 0) {
    const pdocs = await db.getAll(...projectIds.map(id => db.collection("projects").doc(id)))
    pdocs.forEach(p => { if (p.exists) projectMap[p.id] = p.data() })
  }

  const clientIds = [...new Set(Object.values(projectMap).map((p: any) => p.clientId).filter(Boolean))]
  const clientMap: Record<string, any> = {}
  if (clientIds.length > 0) {
    const cdocs = await db.getAll(...clientIds.map(id => db.collection("clients").doc(id)))
    cdocs.forEach(c => { if (c.exists) clientMap[c.id] = { name: c.data()!.name } })
  }

  return NextResponse.json(
    snap.docs.map(doc => {
      const data = doc.data()
      const proj = projectMap[data.projectId]
      return { id: doc.id, ...s(data), project: proj ? { name: proj.name, client: clientMap[proj.clientId] || null } : null }
    })
  )
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const id = uuidv4()
  await db.collection("tasks").doc(id).set({ ...body, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, ...body }, { status: 201 })
}
