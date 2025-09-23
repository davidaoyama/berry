import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token
        }
        
        // Allow access to non-protected routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    // Protect dashboard routes
    "/dashboard/:path*",
    // You can add more protected routes here
  ]
}