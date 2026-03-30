import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import * as dotenv from "dotenv"
import * as readline from "readline"

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

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q: string): Promise<string> => new Promise(res => rl.question(q, res))

async function main() {
  console.log("\n🔐 Veliora TechWorks CMS — Create New User\n")

  const name     = await ask("Full Name     : ")
  const email    = await ask("Email         : ")
  const password = await ask("Password      : ")
  const roleInput = await ask("Role (admin/team) [admin]: ")
  const role = roleInput.trim().toLowerCase() === "team" ? "TEAM" : "ADMIN"

  rl.close()

  // Check if email already exists
  const existing = await db.collection("users").where("email", "==", email.trim()).limit(1).get()
  if (!existing.empty) {
    console.error(`\n❌ A user with email "${email.trim()}" already exists.`)
    process.exit(1)
  }

  const hashed = await bcrypt.hash(password, 12)
  const id = uuidv4()
  const now = FieldValue.serverTimestamp()

  await db.collection("users").doc(id).set({
    name: name.trim(),
    email: email.trim(),
    password: hashed,
    role,
    createdAt: now,
    updatedAt: now,
  })

  console.log(`\n✅ User created successfully!`)
  console.log(`   Name  : ${name.trim()}`)
  console.log(`   Email : ${email.trim()}`)
  console.log(`   Role  : ${role}`)
  console.log(`\n   You can now log in at /login\n`)
}

main().catch(err => { console.error("❌ Error:", err.message); process.exit(1) })
