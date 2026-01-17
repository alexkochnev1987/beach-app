import { redirect } from "next/navigation"
export default async function ManagerHotelRedirect({ params }: { params: { hotelId: string } }) {
  redirect(`/manager/hotel?hotelId=${encodeURIComponent(params.hotelId)}`)
}
