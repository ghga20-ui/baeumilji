import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SetupForm from '@/components/SetupForm'

const mockPush = jest.fn()
const mockFrom = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom })
}))

describe('SetupForm', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockPush.mockClear()
  })

  it('학번 입력 필드가 렌더링된다', () => {
    render(<SetupForm userId="user-1" />)
    expect(screen.getByPlaceholderText(/학번 입력/i)).toBeInTheDocument()
  })

  it('학번 조회 성공 시 이름 확인 화면이 표시된다', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: { id: 'stu-1', name: '박지호', student_number: '20314', google_user_id: null },
        error: null
      })})})
    })
    render(<SetupForm userId="user-1" />)
    fireEvent.change(screen.getByPlaceholderText(/학번 입력/i), { target: { value: '20314' } })
    fireEvent.click(screen.getByText('확인'))
    await waitFor(() => {
      expect(screen.getByText(/박지호 맞나요/i)).toBeInTheDocument()
    })
  })

  it('이미 연동된 학번 입력 시 오류 메시지가 표시된다', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: { id: 'stu-1', name: '김민준', student_number: '20301', google_user_id: 'other-user' },
        error: null
      })})})
    })
    render(<SetupForm userId="user-1" />)
    fireEvent.change(screen.getByPlaceholderText(/학번 입력/i), { target: { value: '20301' } })
    fireEvent.click(screen.getByText('확인'))
    await waitFor(() => {
      expect(screen.getByText(/이미 연동된 학번/i)).toBeInTheDocument()
    })
  })

  it('이름 확인 후 맞아요 클릭 시 /journal로 이동한다', async () => {
    // Search mock
    mockFrom.mockReturnValueOnce({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: { id: 'stu-1', name: '박지호', student_number: '20314', google_user_id: null },
        error: null
      })})})
    })
    // Update mock
    mockFrom.mockReturnValueOnce({
      update: () => ({ eq: () => Promise.resolve({ error: null }) })
    })

    render(<SetupForm userId="user-1" />)
    fireEvent.change(screen.getByPlaceholderText(/학번 입력/i), { target: { value: '20314' } })
    fireEvent.click(screen.getByText('확인'))
    await waitFor(() => screen.getByText(/박지호 맞나요/i))
    fireEvent.click(screen.getByText('맞아요'))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/journal')
    })
  })
})
