import { redirect } from "next/navigation"

export default async function ManagerEditorRedirect({ params }: { params: { hotelId: string } }) {
  redirect(`/manager/editor?hotelId=${encodeURIComponent(params.hotelId)}`)
}
