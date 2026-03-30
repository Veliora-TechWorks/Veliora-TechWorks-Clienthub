import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/firebase"

// Cache user lookups in memory for the process lifetime (avoids repeated Firestore reads)
const userCache = new Map<string, { id: string; name: string; email: string; role: string; password: string }>()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()

        // Check memory cache first
        let user = userCache.get(email)

        if (!user) {
          const snap = await db.collection("users").where("email", "==", email).limit(1).get()
          if (snap.empty) return null
          const data = snap.docs[0].data()
          user = { id: snap.docs[0].id, name: data.name, email: data.email, role: data.role, password: data.password }
          userCache.set(email, user)
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 }, // 24h
  jwt: { maxAge: 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
