import { auth } from "@/auth"
import { Role } from "@prisma/client"

export async function currentUser() {
  const session = await auth()
  return session?.user
}

export async function currentRole() {
  const session = await auth()
  return session?.user?.role as Role | undefined
}
