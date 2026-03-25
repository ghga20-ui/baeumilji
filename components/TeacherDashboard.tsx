'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StudentList from './StudentList'
import JournalDetail from './JournalDetail'

type Class = { id: string; name: string }
type Student = { id: string; name: string; student_number: string; hasPending: boolean; class_id: string | null }

export default function TeacherDashboard({ classes, students }: { classes: Class[]; students: Student[] }) {
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id ?? '')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [journals, setJournals] = useState<any[]>([])
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null)
  const [journalsError, setJournalsError] = useState('')

  const filteredStudents = students.filter(s => !selectedClass || s.class_id === selectedClass)

  const handleSelectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId)
    setSelectedJournal(null)
    setJournalsError('')
    setJournals([])
    const supabase = createClient()
    const { data, error } = await supabase
      .from('journals')
      .select('*, feedbacks(*)')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
    if (error) {
      setJournalsError('배움일지를 불러오지 못했습니다.')
      return
    }
    setJournals(data ?? [])
  }

  return (
    <div className="flex h-[calc(100vh-61px)]">
      {/* 왼쪽: 반 탭 + 학생 목록 */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="flex border-b overflow-x-auto">
          {classes.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setSelectedClass(c.id); setSelectedStudentId(null); setJournals([]); setSelectedJournal(null) }}
              className={`px-4 py-2 text-sm whitespace-nowrap ${selectedClass === c.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <StudentList students={filteredStudents} selectedId={selectedStudentId} onSelect={handleSelectStudent} />
      </div>

      {/* 중간: 배움일지 목록 */}
      <div className="w-72 bg-gray-50 border-r overflow-y-auto">
        {selectedStudentId ? (
          journalsError ? (
            <p className="text-center text-red-500 text-sm py-8">{journalsError}</p>
          ) : journals.length > 0 ? journals.map(j => (
            <button
              key={j.id}
              type="button"
              onClick={() => setSelectedJournal(j)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-white ${selectedJournal?.id === j.id ? 'bg-white' : ''}`}
            >
              <p className="text-xs text-gray-400">{new Date(j.submitted_at).toLocaleDateString('ko-KR')}</p>
              <p className="text-sm text-gray-700 truncate mt-0.5">{j.core_content}</p>
              {(j.feedbacks ?? []).length === 0 && (
                <span className="text-xs text-red-500 mt-1 block">미피드백</span>
              )}
            </button>
          )) : (
            <p className="text-center text-gray-400 text-sm py-8">제출된 배움일지가 없어요</p>
          )
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">학생을 선택하세요</p>
        )}
      </div>

      {/* 오른쪽: 상세 + 피드백 */}
      <div className="flex-1 overflow-y-auto">
        {selectedJournal ? (
          <JournalDetail journal={selectedJournal} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            배움일지를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
