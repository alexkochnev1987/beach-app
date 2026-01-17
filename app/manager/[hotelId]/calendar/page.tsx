import { redirect } from "next/navigation"
export default async function ManagerCalendarRedirect({
  params,
  searchParams,
}: {
  params: { hotelId: string }
  searchParams: { date?: string }
}) {
  const dateParam = searchParams.date ? `&date=${encodeURIComponent(searchParams.date)}` : ""
  redirect(`/manager/calendar?hotelId=${encodeURIComponent(params.hotelId)}${dateParam}`)
}
