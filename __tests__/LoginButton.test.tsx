import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginButton from '@/components/LoginButton'

const mockSignInWithOAuth = jest.fn().mockResolvedValue({ error: null })
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithOAuth: mockSignInWithOAuth }
  })
}))

describe('LoginButton', () => {
  beforeEach(() => mockSignInWithOAuth.mockClear())

  it('Google 로그인 버튼이 렌더링된다', () => {
    render(<LoginButton />)
    expect(screen.getByText(/Google로 로그인/i)).toBeInTheDocument()
  })

  it('클릭 시 Google OAuth 로그인을 호출한다', async () => {
    render(<LoginButton />)
    await userEvent.click(screen.getByText(/Google로 로그인/i))
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })
})
