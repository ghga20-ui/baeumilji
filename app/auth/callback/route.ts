import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
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
