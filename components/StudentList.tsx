'use client'
type Student = { id: string; name: string; student_number: string; hasPending: boolean }
type Props = { students: Student[]; selectedId: string | null; onSelect: (id: string) => void }

export default function StudentList({ students, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-y-auto">
      {students.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={`w-full text-left px-4 py-3 border-b flex justify-between items-center hover:bg-gray-50 ${
            selectedId === s.id ? 'bg-blue-50' : ''
          }`}
        >
          <div>
            <p className="font-medium text-sm text-gray-800">{s.name}</p>
            <p className="text-xs text-gray-400">{s.student_number}</p>
          </div>
          {s.hasPending && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">미확인</span>
          )}
        </button>
      ))}
    </div>
  )
}
