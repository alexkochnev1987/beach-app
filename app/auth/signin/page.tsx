import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-6">Welcome Back</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to manage your bookings</p>
        
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/book" })
          }}
        >
          <Button type="submit" className="w-full">
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  )
}
