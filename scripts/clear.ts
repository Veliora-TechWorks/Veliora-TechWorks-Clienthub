import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
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

const COLLECTIONS = [
  "clients",
  "projects",
  "tasks",
  "payments",
  "invoices",
  "leads",
  "callLogs",
  "activityLogs",
  "onboardingChecklists",
]

async function deleteCollection(name: string) {
  const snap = await db.collection(name).get()
  if (snap.empty) { console.log(`  ${name}: empty`); return }
  const batch = db.batch()
  snap.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
  console.log(`  ✓ ${name}: deleted ${snap.size} documents`)
}

async function main() {
  console.log("\n🗑️  Clearing all Veliora ClientHub data...\n")
  for (const col of COLLECTIONS) {
    await deleteCollection(col)
  }
  console.log("\n✅ All data cleared. Run 'npm run db:seed' to create the admin user.\n")
}

main().catch(console.error)
