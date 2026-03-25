import { render, screen, fireEvent } from '@testing-library/react'
import LoginButton from '@/components/LoginButton'

const mockSignInWithOAuth = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithOAuth: mockSignInWithOAuth }
  })
}))

describe('LoginButton', () => {
  it('Google 로그인 버튼이 렌더링된다', () => {
    render(<LoginButton />)
    expect(screen.getByText(/Google로 로그인/i)).toBeInTheDocument()
  })

  it('클릭 시 Google OAuth 로그인을 호출한다', () => {
    render(<LoginButton />)
    fireEvent.click(screen.getByText(/Google로 로그인/i))
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })
})
