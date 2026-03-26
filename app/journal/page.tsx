import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLinkedStudent, isTeacher } from '@/lib/auth'
import JournalForm from '@/components/JournalForm'
import Link from 'next/link'
import { DEV_PREVIEW, mockStudent } from '@/lib/dev-preview'

export default async function JournalPage() {
  if (DEV_PREVIEW) {
    const student = mockStudent
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">배움일지 작성</h1>
            <Link href="/my" className="text-sm text-blue-600">내 기록 보기</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <JournalForm studentId={student.id} studentName={student.name} />
          </div>
        </div>
      </main>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const teacher = await isTeacher()
  if (teacher) redirect('/teacher')

  const student = await getLinkedStudent()
  if (!student) redirect('/setup')

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">배움일지 작성</h1>
          <Link href="/my" className="text-sm text-blue-600">내 기록 보기</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <JournalForm studentId={student.id} studentName={student.name} />
        </div>
      </div>
    </main>
  )
}
