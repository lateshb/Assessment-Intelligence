import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already authenticated, redirect to home
  if (user) {
    redirect('/')
  }

  return <LoginForm />
}
