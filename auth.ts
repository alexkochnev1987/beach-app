import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: true,
  events: {
    async createUser({ user }) {
      console.log("✅ Пользователь успешно создан в БД:", user.email)
    },
    async linkAccount({ user }) {
      console.log("🔗 Аккаунт Google привязан к пользователю:", user.email)
    },
  },
  ...authConfig,
})
