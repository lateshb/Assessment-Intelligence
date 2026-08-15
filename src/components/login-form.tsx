'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
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
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6FC] px-4 py-12">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#26306A] text-2xl text-white shadow-md">
            🧠
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EDEFF6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#26306A] mb-2">
            Teacher Diagnostic Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26306A] tracking-tight">
            Assessment Intelligence
          </h1>
          <p className="mt-2 text-sm text-[#565C82] max-w-xs mx-auto">
            Diagnose student misconceptions and turn assessment data into high-impact teaching actions.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 border border-[#D5DAEC] shadow-sm">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#141834] font-semibold px-6 py-3.5 rounded-xl border border-[#D5DAEC] hover:bg-[#F4F6FC] hover:border-[#3A4A9F] shadow-xs transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 border-t border-[#EDEFF6] pt-4 text-center">
            <p className="text-xs text-[#565C82] leading-relaxed">
              Protected workspace for verified educators. Instant diagnostic rubric classification.
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 text-center flex items-center justify-center gap-4 text-xs font-semibold text-[#3A4A9F]">
          <a
            href="/how-to-use"
            className="hover:underline"
          >
            How to use
          </a>
          <span className="text-[#D5DAEC]">·</span>
          <a
            href="/build-and-scale"
            className="hover:underline"
          >
            Architecture &amp; scale
          </a>
        </div>
      </div>
    </div>
  )
}
