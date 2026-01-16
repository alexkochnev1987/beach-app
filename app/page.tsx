import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Beach Booking System
        </h1>
        <p className="text-lg text-slate-600 max-w-md">
          Reserve your perfect spot in the sun. Administrator and Manager portals available.
        </p>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link href="/book">
            <Button size="lg">Book a Sunbed</Button>
          </Link>
          <Link href="/auth/signin">
             <Button variant="outline" size="lg">Sign In</Button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-slate-400">
            <Link href="/demo/editor" className="hover:underline">
               Manager Map Editor &rarr;
            </Link>
        </div>
      </main>
    </div>
  );
}
