'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[#26306A] hover:bg-[#E9ECF9]"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#26306A] text-xs font-bold text-white">
          {user.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="text-sm font-medium hidden sm:inline">
          {user.email?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl border border-[#D5DAEC] bg-white p-2 shadow-lg">
            <div className="border-b border-[#D5DAEC] px-3 py-2 mb-2">
              <p className="text-sm font-medium text-[#141834]">
                {user.email}
              </p>
              <p className="text-xs text-[#565C82] mt-0.5">Teacher Account</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
