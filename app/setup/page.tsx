import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLinkedStudent } from '@/lib/auth'
import SetupForm from '@/components/SetupForm'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const student = await getLinkedStudent()
  if (student) redirect('/journal')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm w-full mx-4">
        <h1 className="text-xl font-bold text-gray-800 mb-6 text-center">학번 연동</h1>
        <SetupForm userId={user.id} />
      </div>
    </main>
  )
}
