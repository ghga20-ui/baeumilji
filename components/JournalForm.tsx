'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = { studentId: string; studentName: string; onSubmitted?: () => void }

export default function JournalForm({ studentId, studentName, onSubmitted }: Props) {
  const [form, setForm] = useState({ core_content: '', questions: '', todays_task: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const isValid = form.core_content && form.questions && form.todays_task

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('journals').insert({ student_id: studentId, ...form })
    if (error) {
      setError('제출에 실패했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    onSubmitted?.()
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-gray-700">배움일지를 제출했어요!</p>
        <button type="button" onClick={() => setDone(false)} className="mt-4 text-blue-600 text-sm">
          한 번 더 쓰기
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-gray-500 text-sm">{studentName} 님의 배움일지</p>
      {[
        { key: 'core_content', label: '오늘 배운 핵심 내용', placeholder: '오늘 수업에서 가장 중요하다고 생각한 것을 써주세요' },
        { key: 'questions', label: '궁금한 점 / 달라진 생각', placeholder: '궁금한 점이나 수업 후 생각이 바뀐 점을 써주세요' },
        { key: 'todays_task', label: '오늘의 과제', placeholder: '오늘 해야 할 과제나 실천할 것을 써주세요' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={key}>{label}</label>
          <textarea
            id={key}
            aria-label={label}
            placeholder={placeholder}
            value={form[key as keyof typeof form]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      ))}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? '제출 중...' : '제출'}
      </button>
    </div>
  )
}
