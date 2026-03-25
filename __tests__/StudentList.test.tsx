import { render, screen, fireEvent } from '@testing-library/react'
import StudentList from '@/components/StudentList'

const mockStudents = [
  { id: 'stu-1', name: '김민준', student_number: '20301', hasPending: true },
  { id: 'stu-2', name: '이서연', student_number: '20302', hasPending: false },
]

describe('StudentList', () => {
  it('학생 목록이 렌더링된다', () => {
    render(<StudentList students={mockStudents} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('이서연')).toBeInTheDocument()
  })

  it('미피드백 학생에 강조 표시가 된다', () => {
    render(<StudentList students={mockStudents} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText('미확인')).toBeInTheDocument()
  })

  it('학생 클릭 시 onSelect가 호출된다', () => {
    const onSelect = jest.fn()
    render(<StudentList students={mockStudents} selectedId={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('김민준'))
    expect(onSelect).toHaveBeenCalledWith('stu-1')
  })
})
