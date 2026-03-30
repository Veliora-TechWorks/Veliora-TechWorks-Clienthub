import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { requireAuth } from "@/lib/api-helpers"

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error
  const snap = await db.collection("activityLogs").orderBy("createdAt", "desc").limit(50).get()
  const logs = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data()
      let user = null
      if (data.userId) {
        const userDoc = await db.collection("users").doc(data.userId).get()
        user = userDoc.exists ? { name: userDoc.data()!.name } : null
      }
      return { id: doc.id, ...data, user }
    })
  )
  return NextResponse.json(logs)
}
