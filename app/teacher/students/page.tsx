import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isTeacher } from '@/lib/auth'
import StudentUpload from '@/components/StudentUpload'
import AddClassForm from '@/components/AddClassForm'
import Link from 'next/link'
import { DEV_PREVIEW, mockClassesWithStudents } from '@/lib/dev-preview'

export default async function StudentsPage() {
  if (DEV_PREVIEW) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">학생 관리</h1>
            <Link href="/teacher" className="text-sm text-blue-600">← 대시보드</Link>
          </div>
          {mockClassesWithStudents.map(cls => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm p-5 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3">{cls.name} ({cls.students.length}명)</h2>
              <StudentUpload classId={cls.id} />
              <div className="mt-4 divide-y">
                {cls.students.map(s => (
                  <div key={s.id} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-700">{s.name}</span>
                    <span className="text-gray-400">{s.student_number}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <AddClassForm />
        </div>
      </main>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  if (!(await isTeacher())) redirect('/')

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('*, students(*)')
    .order('name')

  if (classesError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">데이터를 불러오는 데 실패했습니다. 페이지를 새로고침해 주세요.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">학생 관리</h1>
          <Link href="/teacher" className="text-sm text-blue-600">← 대시보드</Link>
        </div>
        {classes?.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-gray-700 mb-3">
              {cls.name} ({(cls.students as any[])?.length ?? 0}명)
            </h2>
            <StudentUpload classId={cls.id} />
            <div className="mt-4 divide-y">
              {(cls.students as any[])?.map((s: any) => (
                <div key={s.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">{s.name}</span>
                  <span className="text-gray-400">{s.student_number}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <AddClassForm />
      </div>
    </main>
  )
}
