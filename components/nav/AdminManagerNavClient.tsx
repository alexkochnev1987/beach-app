"use client"

import Link from "next/link"

export default function AdminManagerNavClient({
  isAdmin,
}: {
  isAdmin: boolean
}) {
  return (
    <div className="mb-6 rounded-xl border bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {isAdmin && (
          <Link className="rounded-md border px-3 py-1 hover:bg-slate-50" href="/admin/hotels">
            Hotels Admin
          </Link>
        )}

        <Link
          className="rounded-md border px-3 py-1 hover:bg-slate-50"
          href="/manager/editor"
        >
          Map Editor
        </Link>
        <Link
          className="rounded-md border px-3 py-1 hover:bg-slate-50"
          href="/manager/hotel"
        >
          Hotel
        </Link>
      </div>
    </div>
  )
}
