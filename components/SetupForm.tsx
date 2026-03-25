'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetupForm({ userId }: { userId: string }) {
  const [studentNumber, setStudentNumber] = useState('')
  const [student, setStudent] = useState<{ id: string; name: string; google_user_id: string | null } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select('id, name, student_number, google_user_id')
      .eq('student_number', studentNumber)
      .single()

    if (error || !data) {
      setError('등록되지 않은 학번입니다. 선생님에게 문의하세요.')
    } else if (data.google_user_id && data.google_user_id !== userId) {
      setError('이미 연동된 학번입니다. 선생님에게 문의하세요.')
    } else {
      setStudent(data)
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!student) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('students')
      .update({ google_user_id: userId })
      .eq('id', student.id)
    router.push('/journal')
  }

  if (student) {
    return (
      <div className="text-center">
        <p className="text-xl font-semibold mb-2">{student.name} 맞나요?</p>
        <p className="text-gray-500 text-sm mb-6">본인이 맞으면 확인을 눌러주세요</p>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={() => setStudent(null)} className="px-5 py-2 border rounded-lg text-gray-600">
            아니요
          </button>
          <button type="button" onClick={handleConfirm} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg">
            {loading ? '처리 중...' : '맞아요'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-gray-600 mb-4 text-sm">처음 이용 시 학번을 입력해 계정을 연동해 주세요</p>
      <input
        type="text"
        placeholder="학번 입력"
        value={studentNumber}
        onChange={e => setStudentNumber(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-3 text-center text-lg"
      />
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        type="button"
        onClick={handleSearch}
        disabled={loading || !studentNumber}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? '조회 중...' : '확인'}
      </button>
    </div>
  )
}
