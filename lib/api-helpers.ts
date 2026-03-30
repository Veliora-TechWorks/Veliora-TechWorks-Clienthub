import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null }
  return { error: null, session }
}

export async function requireAdmin() {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }
  if (session!.user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null }
  return { error: null, session }
}

// Wrap a response with cache headers for GET routes
export function cachedResponse(data: unknown, seconds = 30) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `private, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`,
    },
  })
}
