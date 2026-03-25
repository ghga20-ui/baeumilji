import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')

  // 사용자가 Google 로그인 거부한 경우
  if (oauthError) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(oauthError)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    // 코드 교환 실패 시 로그인 페이지로 리다이렉트
    if (error) {
      return NextResponse.redirect(`${origin}/?error=auth`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      // 교사 확인
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', user.email)
        .single()
      if (teacher) return NextResponse.redirect(`${origin}/teacher`)

      // 이미 학번 연동된 학생 확인
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('google_user_id', user.id)
        .single()
      if (student) return NextResponse.redirect(`${origin}/journal`)
    }
  }

  return NextResponse.redirect(`${origin}/setup`)
}
