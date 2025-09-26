import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

// Add this at the top to see when the file loads
console.log("🔧 NextAuth route file loaded")
console.log("🔧 Environment variables check:")
console.log("🔧 - GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID)
console.log("🔧 - GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET)
console.log("🔧 - ALLOWED_DOMAINS:", process.env.ALLOWED_DOMAINS)

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔍 =====================================")
      console.log("🔍 SignIn callback triggered!")
      console.log("🔍 User:", JSON.stringify(user, null, 2))
      console.log("🔍 Account provider:", account?.provider)
      console.log("🔍 User email:", user.email)
      
      // Check if user's email domain matches any of the allowed domains
      const allowedDomainsEnv = process.env.ALLOWED_DOMAINS || process.env.ALLOWED_DOMAIN
      console.log("🔍 Raw allowed domains env:", allowedDomainsEnv)
      
      if (!allowedDomainsEnv) {
        console.error("❌ ALLOWED_DOMAINS or ALLOWED_DOMAIN environment variable not set")
        return false
      }

      if (user.email) {
        const emailDomain = user.email.split("@")[1]
        console.log("🔍 Extracted email domain:", emailDomain)
        
        // Split the allowed domains by comma and trim whitespace
        const allowedDomains = allowedDomainsEnv.split(",").map(domain => domain.trim())
        console.log("🔍 Processed allowed domains:", allowedDomains)
        
        // Allow sign in if the email domain matches any of the allowed domains
        if (allowedDomains.includes(emailDomain)) {
          console.log(`✅ Sign-in ALLOWED: ${user.email} (domain: ${emailDomain})`)
          return true
        } else {
          console.log(`❌ Sign-in REJECTED: ${user.email} (domain: ${emailDomain}) not in [${allowedDomains.join(", ")}]`)
          return false
        }
      }
      
      console.log("❌ Sign-in REJECTED: No email provided")
      return false
    },
    async jwt({ token, user }) {
      console.log("🔑 JWT callback triggered")
      if (user) {
        console.log("🔑 Adding user info to token:", user.email)
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      console.log("👤 Session callback triggered")
      console.log("👤 Token email:", token.email)
      // Pass token information to the session
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  events: {
    async signIn(message) {
      console.log("📅 SignIn event:", message)
    },
    async signOut(message) {
      console.log("📅 SignOut event:", message)
    },
    async createUser(message) {
      console.log("📅 CreateUser event:", message)
    },
    async session(message) {
      console.log("📅 Session event:", message)
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }