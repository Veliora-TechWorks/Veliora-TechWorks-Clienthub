export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/leads/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/calls/:path*",
    "/payments/:path*",
    "/analytics/:path*",
    "/automation/:path*",
    "/settings/:path*",
  ],
}
