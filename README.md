# Veliora ClientHub

A production-ready CRM + Project + Automation Platform built for **Veliora TechWorks**.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + ShadCN UI
- **Firebase Admin SDK** + Firestore
- **NextAuth** (Credentials)
- **Recharts** (Analytics)
- **@hello-pangea/dnd** (Kanban drag & drop)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `.env`:

```env
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Firebase Admin SDK (Firebase Console > Project Settings > Service Accounts > Generate new private key)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

### 3. Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Firestore Database** (Native mode)
3. Go to **Project Settings > Service Accounts** and generate a new private key
4. Fill in the `.env` values from the downloaded JSON

### 4. Seed Demo Data

```bash
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@veliora.com    | admin123  |
| Team  | team@veliora.com     | team123   |

---

## Features

| Module            | Description                                      |
|-------------------|--------------------------------------------------|
| Dashboard         | KPI cards, charts, recent activity feed          |
| Clients           | Full CRUD, profile view, tags, CSV export        |
| Leads             | Kanban board with drag & drop, convert to client |
| Projects          | Status tracking, progress %, onboarding checklist|
| Tasks             | Per-project tasks, priority, deadlines           |
| Call Logs         | Log calls, outcomes, schedule follow-ups         |
| Payments          | Track payments, mark paid, overdue alerts        |
| Invoices          | Generate invoices with line items                |
| Analytics         | Revenue charts, client growth, lead conversion   |
| Automation        | Rule-based triggers and actions                  |
| Settings          | Profile, theme (dark/light), security            |

---

## Project Structure

```
/app
  /(auth)/login          → Login page
  /(dashboard)/          → All dashboard pages
  /api/                  → REST API routes
/components
  /layout/               → Sidebar, Navbar
  /ui/                   → ShadCN components
/lib                     → Firebase, Auth, Utils
/scripts                 → Firestore seed
/hooks                   → useToast
/types                   → NextAuth types
```

---

## Database Commands

```bash
npm run db:seed      # Seed demo data into Firestore
```

---

Built with ❤️ by Veliora TechWorks
