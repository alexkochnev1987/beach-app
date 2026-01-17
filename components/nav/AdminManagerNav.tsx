import { auth } from "@/auth"
import AdminManagerNavClient from "@/components/nav/AdminManagerNavClient"

export default async function AdminManagerNav() {
  const session = await auth()
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER")) {
    return null
  }

  const isAdmin = session.user?.role === "ADMIN"

  return <AdminManagerNavClient isAdmin={isAdmin} />
}
