'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AddClassForm() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('classes').insert({ name: name.trim() })
    setSubmitting(false)
    if (error) {
      setError('반 추가에 실패했습니다. 다시 시도해 주세요.')
      return
    }
    setName('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-semibold text-gray-700 mb-3">반 추가</h2>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="반 이름 (예: 1반)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          required
        />
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {submitting ? '추가 중...' : '추가'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  )
}
