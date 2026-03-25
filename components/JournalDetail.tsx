'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Journal = {
  id: string
  core_content: string
  questions: string
  todays_task: string
  submitted_at: string
  feedbacks: { id?: string; content: string }[]
}

export default function JournalDetail({ journal }: { journal: Journal }) {
  const existing = journal.feedbacks[0]
  const [feedback, setFeedback] = useState(existing?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('feedbacks').upsert(
      { journal_id: journal.id, content: feedback, updated_at: new Date().toISOString() },
      { onConflict: 'journal_id' }
    )
    if (error) {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setSaving(false)
      return
    }
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-gray-400">
        {new Date(journal.submitted_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      {[
        { label: '핵심 내용', value: journal.core_content },
        { label: '궁금한 점 / 달라진 생각', value: journal.questions },
        { label: '오늘의 과제', value: journal.todays_task },
      ].map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{value}</p>
        </div>
      ))}
      <div>
        <p className="text-xs font-medium text-blue-600 mb-1">피드백</p>
        <textarea
          placeholder="피드백 입력..."
          value={feedback}
          onChange={e => { setFeedback(e.target.value); setSaved(false) }}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !feedback}
          className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
        </button>
      </div>
    </div>
  )
}
