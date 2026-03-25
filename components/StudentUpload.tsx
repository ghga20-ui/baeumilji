'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StudentUpload({ classId }: { classId: string }) {
  const [result, setResult] = useState('')
  const router = useRouter()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const rows = text.trim().split('\n').slice(1) // 헤더 제외
    const students = rows.map(row => {
      const [student_number, name] = row.replace(/\r/g, '').split(',').map(s => s.trim())
      return { student_number, name, class_id: classId }
    }).filter(s => s.student_number && s.name)

    if (students.length === 0) {
      setResult('등록할 학생이 없습니다. CSV 형식을 확인해 주세요.')
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('students').upsert(students, { onConflict: 'student_number' })
    if (error) {
      setResult(`오류: ${error.message}`)
    } else {
      setResult(`${students.length}명 등록 완료`)
      router.refresh()
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">CSV 형식: 학번,이름 (첫 줄은 헤더)</p>
      <input type="file" accept=".csv" onChange={handleFile} className="text-sm" />
      {result && <p className="mt-2 text-sm text-blue-600">{result}</p>}
    </div>
  )
}
