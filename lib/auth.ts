import { createClient } from '@/lib/supabase/server'

export async function isTeacher(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const { data } = await supabase
    .from('teachers')
    .select('id')
    .eq('email', user.email)
    .single()
  return !!data
}

export async function getLinkedStudent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('google_user_id', user.id)
    .single()
  return data
}
