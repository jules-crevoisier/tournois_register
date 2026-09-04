import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const protectedRoutes = ["/profile"]
const adminRoutes = ["/admin"]

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Admin routes protection
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check for ADMIN or ORGANIZER role
    const userRole = req.auth.user?.role
    if (userRole !== "ADMIN" && userRole !== "ORGANIZER") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Protected routes (require authentication)
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
}
