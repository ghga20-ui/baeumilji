import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLinkedStudent } from '@/lib/auth'
import JournalList from '@/components/JournalList'
import Link from 'next/link'
import { DEV_PREVIEW, mockJournals } from '@/lib/dev-preview'

export default async function MyPage() {
  if (DEV_PREVIEW) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">내 배움일지</h1>
            <Link href="/journal" className="text-sm text-blue-600">새로 쓰기</Link>
          </div>
          <JournalList journals={mockJournals} />
        </div>
      </main>
    )
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const student = await getLinkedStudent()
  if (!student) redirect('/setup')

  const { data: journals, error: journalsError } = await supabase
    .from('journals')
    .select('*, feedbacks(*)')
    .eq('student_id', student.id)
    .order('submitted_at', { ascending: false })

  if (journalsError) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto text-center py-16 text-red-500">
          <p>기록을 불러오는 데 실패했습니다. 페이지를 새로고침해 주세요.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">내 배움일지</h1>
          <Link href="/journal" className="text-sm text-blue-600">새로 쓰기</Link>
        </div>
        {journals && journals.length > 0 ? (
          <JournalList journals={journals} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>아직 작성한 배움일지가 없어요</p>
          </div>
        )}
      </div>
    </main>
  )
}
