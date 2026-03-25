import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isTeacher } from '@/lib/auth'
import TeacherDashboard from '@/components/TeacherDashboard'
import Link from 'next/link'

export default async function TeacherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  if (!(await isTeacher())) redirect('/')

  const { data: classes, error: classesError } = await supabase.from('classes').select('*').order('name')
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*, classes(name), journals(id, feedbacks(id))')
    .order('student_number')

  if (classesError || studentsError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">데이터를 불러오는 데 실패했습니다. 페이지를 새로고침해 주세요.</p>
      </main>
    )
  }

  const studentsWithPending = (students ?? []).map(s => ({
    ...s,
    hasPending: (s.journals as any[])?.some((j: any) => (j.feedbacks ?? []).length === 0) ?? false,
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <h1 className="text-lg font-bold text-gray-800">배움일지 대시보드</h1>
        <Link href="/teacher/students" className="text-sm text-blue-600">학생 관리</Link>
      </div>
      <TeacherDashboard classes={classes ?? []} students={studentsWithPending} />
    </main>
  )
}
