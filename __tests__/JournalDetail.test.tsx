import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JournalDetail from '@/components/JournalDetail'

const mockUpsert = jest.fn().mockResolvedValue({ error: null })
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => table === 'feedbacks'
      ? { upsert: mockUpsert }
      : { update: jest.fn() }
  })
}))

const mockJournal = {
  id: 'j1',
  core_content: '소설 시점',
  questions: '궁금한 점',
  todays_task: '시점 분석',
  submitted_at: '2026-03-24T10:00:00Z',
  feedbacks: [],
}

describe('JournalDetail', () => {
  beforeEach(() => mockUpsert.mockClear())

  it('배움일지 내용이 표시된다', () => {
    render(<JournalDetail journal={mockJournal} />)
    expect(screen.getByText('소설 시점')).toBeInTheDocument()
  })

  it('피드백 입력 후 저장 시 upsert가 호출된다', async () => {
    render(<JournalDetail journal={mockJournal} />)
    fireEvent.change(screen.getByPlaceholderText(/피드백 입력/i), { target: { value: '잘했어요' } })
    fireEvent.click(screen.getByText('저장'))
    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ content: '잘했어요' }), expect.any(Object))
    })
  })
})
