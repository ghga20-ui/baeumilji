type Journal = {
  id: string
  core_content: string
  questions: string
  todays_task: string
  submitted_at: string
  feedbacks: { content: string }[]
}

export default function JournalList({ journals }: { journals: Journal[] }) {
  return (
    <div className="space-y-4">
      {journals.map(j => (
        <div key={j.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-3">
            {new Date(j.submitted_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">핵심 내용</p>
              <p className="text-sm text-gray-800">{j.core_content}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">궁금한 점 / 달라진 생각</p>
              <p className="text-sm text-gray-800">{j.questions}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">오늘의 과제</p>
              <p className="text-sm text-gray-800">{j.todays_task}</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-600 mb-1">선생님 피드백</p>
            {j.feedbacks.length > 0 ? (
              <p className="text-sm text-gray-800">{j.feedbacks[0].content}</p>
            ) : (
              <p className="text-sm text-gray-400">피드백 대기 중...</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
