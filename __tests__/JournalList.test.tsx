import { render, screen } from '@testing-library/react'
import JournalList from '@/components/JournalList'

const mockJournals = [
  {
    id: 'j1',
    core_content: '소설 시점',
    questions: '1인칭 차이',
    todays_task: '시점 분석',
    submitted_at: '2026-03-24T10:00:00Z',
    feedbacks: [{ content: '잘 이해했네요!' }],
  },
  {
    id: 'j2',
    core_content: '운율',
    questions: '자유시와 정형시',
    todays_task: '시 감상문',
    submitted_at: '2026-03-21T10:00:00Z',
    feedbacks: [],
  },
]

describe('JournalList', () => {
  it('배움일지 목록이 날짜별로 렌더링된다', () => {
    render(<JournalList journals={mockJournals} />)
    expect(screen.getByText('소설 시점')).toBeInTheDocument()
    expect(screen.getByText('운율')).toBeInTheDocument()
  })

  it('피드백이 있으면 내용이 표시된다', () => {
    render(<JournalList journals={mockJournals} />)
    expect(screen.getByText('잘 이해했네요!')).toBeInTheDocument()
  })

  it('피드백이 없으면 "선생님 피드백 대기 중" 표시', () => {
    render(<JournalList journals={mockJournals} />)
    expect(screen.getByText(/피드백 대기/i)).toBeInTheDocument()
  })
})
