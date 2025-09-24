import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user's email domain matches any of the allowed domains
      const allowedDomainsEnv = process.env.ALLOWED_DOMAINS || process.env.ALLOWED_DOMAIN
      
      if (!allowedDomainsEnv) {
        console.error("ALLOWED_DOMAINS or ALLOWED_DOMAIN environment variable not set")
        return false
      }

      if (user.email) {
        const emailDomain = user.email.split("@")[1]
        
        // Split the allowed domains by comma and trim whitespace
        const allowedDomains = allowedDomainsEnv.split(",").map(domain => domain.trim())
        
        // Allow sign in if the email domain matches any of the allowed domains
        if (allowedDomains.includes(emailDomain)) {
          console.log(`Sign-in allowed: ${user.email} domain ${emailDomain} is authorized`)
          return true
        } else {
          console.log(`Sign-in rejected: ${user.email} domain ${emailDomain} not in allowed domains: [${allowedDomains.join(", ")}]`)
          return false
        }
      }
      
      console.log("Sign-in rejected: No email provided")
      return false
    },
    async jwt({ token, user }) {
      // Pass user information to the token
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      // Pass token information to the session
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }