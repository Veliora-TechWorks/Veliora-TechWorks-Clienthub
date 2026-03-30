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
const now = FieldValue.serverTimestamp()

async function main() {
  // Users
  const adminId = uuidv4()
  const teamId = uuidv4()
  await db.collection("users").doc(adminId).set({
    name: "Admin User", email: "admin@veliora.com",
    password: await bcrypt.hash("admin123", 12), role: "ADMIN", createdAt: now, updatedAt: now,
  })
  await db.collection("users").doc(teamId).set({
    name: "Team Member", email: "team@veliora.com",
    password: await bcrypt.hash("team123", 12), role: "TEAM", createdAt: now, updatedAt: now,
  })

  // Clients
  const c1 = uuidv4(), c2 = uuidv4(), c3 = uuidv4()
  await db.collection("clients").doc(c1).set({ name: "John Smith", email: "john@techcorp.com", phone: "+1-555-0101", company: "TechCorp Inc.", status: "active", tag: "VIP", notes: "Key enterprise client.", createdAt: now, updatedAt: now })
  await db.collection("clients").doc(c2).set({ name: "Sarah Johnson", email: "sarah@designstudio.com", phone: "+1-555-0102", company: "Design Studio", status: "active", tag: "HIGH_VALUE", createdAt: now, updatedAt: now })
  await db.collection("clients").doc(c3).set({ name: "Mike Davis", email: "mike@startup.io", phone: "+1-555-0103", company: "Startup.io", status: "active", tag: "REGULAR", createdAt: now, updatedAt: now })

  // Projects
  const p1 = uuidv4(), p2 = uuidv4(), p3 = uuidv4()
  await db.collection("projects").doc(p1).set({ name: "E-Commerce Platform", description: "Full-stack e-commerce solution", status: "IN_PROGRESS", progress: 65, clientId: c1, deadline: new Date(Date.now() + 30 * 86400000), createdAt: now, updatedAt: now })
  await db.collection("projects").doc(p2).set({ name: "Brand Identity Redesign", description: "Complete brand overhaul", status: "ONBOARDING", progress: 20, clientId: c2, deadline: new Date(Date.now() + 45 * 86400000), createdAt: now, updatedAt: now })
  await db.collection("projects").doc(p3).set({ name: "Mobile App MVP", description: "React Native mobile application", status: "COMPLETED", progress: 100, clientId: c3, createdAt: now, updatedAt: now })

  // Tasks
  const tasks = [
    { title: "Setup project repository", status: "DONE", priority: "HIGH", projectId: p1 },
    { title: "Design database schema", status: "DONE", priority: "HIGH", projectId: p1 },
    { title: "Build product listing page", status: "IN_PROGRESS", priority: "MEDIUM", projectId: p1, deadline: new Date(Date.now() + 7 * 86400000) },
    { title: "Implement payment gateway", status: "TODO", priority: "HIGH", projectId: p1, deadline: new Date(Date.now() + 14 * 86400000) },
    { title: "Gather brand requirements", status: "IN_PROGRESS", priority: "HIGH", projectId: p2 },
    { title: "Create mood board", status: "TODO", priority: "MEDIUM", projectId: p2 },
  ]
  for (const t of tasks) await db.collection("tasks").doc(uuidv4()).set({ ...t, createdAt: now, updatedAt: now })

  // Onboarding checklists
  await db.collection("onboardingChecklists").doc(uuidv4()).set({ projectId: p1, requirements: true, payment: true, kickoff: true, accessGranted: true, contractSigned: true, createdAt: now, updatedAt: now })
  await db.collection("onboardingChecklists").doc(uuidv4()).set({ projectId: p2, requirements: true, payment: false, kickoff: false, accessGranted: false, contractSigned: true, createdAt: now, updatedAt: now })

  // Leads
  const leads = [
    { name: "Alice Brown", email: "alice@company.com", phone: "+1-555-0201", company: "Brown Co.", source: "Website", status: "NEW", value: 5000, position: 0 },
    { name: "Bob Wilson", email: "bob@enterprise.com", phone: "+1-555-0202", company: "Enterprise Ltd.", source: "Referral", status: "CONTACTED", value: 12000, position: 0 },
    { name: "Carol White", email: "carol@agency.com", source: "LinkedIn", status: "QUALIFIED", value: 8500, position: 0 },
    { name: "David Lee", email: "david@tech.io", source: "Cold Email", status: "CONVERTED", value: 15000, position: 0 },
    { name: "Emma Clark", email: "emma@startup.com", source: "Website", status: "LOST", value: 3000, position: 0 },
  ]
  for (const l of leads) await db.collection("leads").doc(uuidv4()).set({ ...l, createdAt: now, updatedAt: now })

  // Call logs
  await db.collection("callLogs").doc(uuidv4()).set({ clientId: c1, notes: "Discussed project timeline", outcome: "Positive - proceeding with phase 2", nextCall: new Date(Date.now() + 7 * 86400000), duration: 45, date: new Date(), createdAt: now })
  await db.collection("callLogs").doc(uuidv4()).set({ clientId: c1, notes: "Review of initial designs", outcome: "Minor revisions requested", duration: 30, date: new Date(), createdAt: now })
  await db.collection("callLogs").doc(uuidv4()).set({ clientId: c2, notes: "Onboarding call - gathered requirements", outcome: "Requirements documented", nextCall: new Date(Date.now() + 3 * 86400000), duration: 60, date: new Date(), createdAt: now })

  // Payments
  const payments = [
    { clientId: c1, amount: 5000, description: "Initial deposit - E-Commerce Platform", status: "PAID", paidAt: new Date(Date.now() - 30 * 86400000) },
    { clientId: c1, amount: 5000, description: "Milestone 1 payment", status: "PAID", paidAt: new Date(Date.now() - 10 * 86400000) },
    { clientId: c1, amount: 5000, description: "Final payment", status: "PENDING", dueDate: new Date(Date.now() + 20 * 86400000) },
    { clientId: c2, amount: 3000, description: "Brand Identity - Deposit", status: "PENDING", dueDate: new Date(Date.now() + 5 * 86400000) },
    { clientId: c3, amount: 8000, description: "Mobile App MVP - Full payment", status: "PAID", paidAt: new Date(Date.now() - 5 * 86400000) },
  ]
  for (const p of payments) await db.collection("payments").doc(uuidv4()).set({ ...p, createdAt: now, updatedAt: now })

  // Invoice
  await db.collection("invoices").doc(uuidv4()).set({
    invoiceNo: "INV-2024-001", clientId: c1,
    items: [{ description: "E-Commerce Platform Development", quantity: 1, rate: 15000, amount: 15000 }],
    subtotal: 15000, tax: 1500, total: 16500, status: "PENDING",
    dueDate: new Date(Date.now() + 30 * 86400000), createdAt: now, updatedAt: now,
  })

  // Activity logs
  const activityItems = [
    { action: "created", entity: "client", entityId: c1, details: "New client John Smith added", userId: adminId },
    { action: "created", entity: "project", entityId: p1, details: "Project E-Commerce Platform created", userId: adminId },
    { action: "updated", entity: "project", entityId: p1, details: "Project progress updated to 65%", userId: adminId },
    { action: "payment_received", entity: "payment", details: "Payment of $5000 received from TechCorp Inc.", userId: adminId },
  ]
  for (const a of activityItems) await db.collection("activityLogs").doc(uuidv4()).set({ ...a, createdAt: now })

  console.log("✅ Firebase seed completed successfully!")
}

main().catch(console.error)
