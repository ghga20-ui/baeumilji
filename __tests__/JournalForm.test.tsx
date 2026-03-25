import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JournalForm from '@/components/JournalForm'

const mockInsert = jest.fn().mockResolvedValue({ error: null })
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ insert: mockInsert })
  })
}))

describe('JournalForm', () => {
  beforeEach(() => mockInsert.mockClear())

  const props = { studentId: 'stu-1', studentName: '박지호' }

  it('3개 항목 입력 필드가 렌더링된다', () => {
    render(<JournalForm {...props} />)
    expect(screen.getByLabelText(/핵심 내용/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/궁금한 점/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/오늘의 과제/i)).toBeInTheDocument()
  })

  it('빈 필드가 있으면 제출 버튼이 비활성화된다', () => {
    render(<JournalForm {...props} />)
    expect(screen.getByText('제출')).toBeDisabled()
  })

  it('모든 필드 입력 후 제출 시 insert가 호출된다', async () => {
    render(<JournalForm {...props} />)
    fireEvent.change(screen.getByLabelText(/핵심 내용/i), { target: { value: '소설 시점' } })
    fireEvent.change(screen.getByLabelText(/궁금한 점/i), { target: { value: '1인칭과 3인칭 차이' } })
    fireEvent.change(screen.getByLabelText(/오늘의 과제/i), { target: { value: '시점 분석 연습' } })
    fireEvent.click(screen.getByText('제출'))
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        student_id: 'stu-1',
        core_content: '소설 시점',
        questions: '1인칭과 3인칭 차이',
        todays_task: '시점 분석 연습',
      }))
    })
  })
})
