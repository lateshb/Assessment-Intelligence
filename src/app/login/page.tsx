'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    // Use explicit URLs for both environments to ensure correct OAuth callback
    const isDevelopment = window.location.hostname === 'localhost'
    const redirectTo = isDevelopment
      ? 'http://localhost:3000/auth/callback'
      : 'https://assessment-intelligence.vercel.app/auth/callback'

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      console.error('Error signing in:', error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070C]">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Assessment Intelligence
          </h1>
          <p className="text-gray-400">
            Identify learning gaps with AI-powered analysis
          </p>
        </div>

        <div className="bg-[#0F131C] rounded-2xl p-8 border border-gray-800">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="text-sm text-gray-500 mt-6 text-center">
            By signing in, you agree to use this tool for educational purposes.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/how-to-use"
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Learn how to use this tool →
          </a>
        </div>
      </div>
    </div>
  )
}
