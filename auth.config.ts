import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const paths = ["/book", "/manager", "/admin"]
      const isProtected = paths.some((path) => nextUrl.pathname.startsWith(path))

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL("/api/auth/signin", nextUrl.origin)
        redirectUrl.searchParams.append("callbackUrl", nextUrl.href)
        return Response.redirect(redirectUrl)
      }
      return true
    },
    // @ts-ignore
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      // Note: Role might not be available in edge middleware session unless we put it in token
      // We will handle role checks inside the middleware logic or repeated in auth.ts
      return session
    },
    async jwt({ token, user, trigger, session }) {
        if (user) {
            token.sub = user.id
            // @ts-ignore
            token.role = user.role
        }
        return token
    }
  },
} satisfies NextAuthConfig
