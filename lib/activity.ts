import { db } from "@/lib/firebase"
import { FieldValue } from "firebase-admin/firestore"

export async function logActivity(
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  userId?: string
) {
  try {
    await db.collection("activityLogs").add({
      action, entity, entityId: entityId || null,
      details: details || null, userId: userId || null,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}
