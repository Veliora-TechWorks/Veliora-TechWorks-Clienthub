import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import * as dotenv from "dotenv"

dotenv.config()

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

const db = getFirestore()

async function main() {
  const now = FieldValue.serverTimestamp()

  const adminId = uuidv4()
  await db.collection("users").doc(adminId).set({
    name: "Admin",
    email: "admin@veliora.com",
    password: await bcrypt.hash("admin123", 12),
    role: "ADMIN",
    createdAt: now,
    updatedAt: now,
  })

  console.log("✅ Admin user created: admin@veliora.com / admin123")
  console.log("   Change your password after first login.")
}

main().catch(console.error)
