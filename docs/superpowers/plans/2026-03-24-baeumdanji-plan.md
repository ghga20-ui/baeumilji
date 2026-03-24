# 배움일지 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 고등학교 교사가 학생 배움일지를 수집하고 개별 피드백을 제공하는 웹앱 구축

**Architecture:** Next.js App Router + Supabase (Auth + PostgreSQL). Google OAuth로 학생/교사 인증, RLS로 데이터 접근 제어. Vercel 무료 배포.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Vercel

**Spec:** `docs/superpowers/specs/2026-03-24-baeumdanji-design.md`

---

## 파일 구조

```
project4/
├── app/
│   ├── layout.tsx                  # Root layout (Supabase provider 포함)
│   ├── page.tsx                    # 랜딩/로그인 페이지
│   ├── setup/page.tsx              # 학번 연동 (최초 1회)
│   ├── journal/page.tsx            # 배움일지 작성
│   ├── my/page.tsx                 # 내 기록 보기
│   ├── teacher/page.tsx            # 교사 대시보드
│   ├── teacher/students/page.tsx   # 학생 관리
│   └── auth/callback/route.ts      # Google OAuth 콜백
├── components/
│   ├── LoginButton.tsx             # Google 로그인 버튼
│   ├── SetupForm.tsx               # 학번 연동 폼
│   ├── JournalForm.tsx             # 배움일지 작성 폼
│   ├── JournalList.tsx             # 내 기록 목록 (날짜별 그룹)
│   ├── StudentList.tsx             # 교사: 왼쪽 학생 목록
│   ├── JournalDetail.tsx           # 교사: 오른쪽 상세 + 피드백 입력
│   └── StudentUpload.tsx           # CSV 업로드 컴포넌트
├── lib/
│   ├── supabase/client.ts          # 브라우저용 Supabase 클라이언트
│   ├── supabase/server.ts          # 서버용 Supabase 클라이언트
│   └── auth.ts                     # isTeacher(), getStudent() 헬퍼
├── middleware.ts                   # 라우트 보호 미들웨어
├── supabase/migrations/
│   └── 001_initial.sql             # 스키마 + RLS
└── __tests__/
    ├── SetupForm.test.tsx
    ├── JournalForm.test.tsx
    ├── JournalList.test.tsx
    ├── StudentList.test.tsx
    └── JournalDetail.test.tsx
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local.example`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd C:/Users/admin/Desktop/2026_project/project4
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: Supabase 관련 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: 환경변수 예시 파일 생성**

`C:/Users/admin/Desktop/2026_project/project4/.env.local.example` 파일 생성:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: 테스트 환경 설치**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

`jest.config.ts` 생성:
```ts
import type { Config } from 'jest'
const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
}
export default config
```

`jest.setup.ts` 생성:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공 (Next.js 기본 페이지)

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with Supabase and testing setup"
```

---

## Task 2: Supabase DB 스키마 + RLS

**Files:**
- Create: `supabase/migrations/001_initial.sql`

> **사전 작업:** Supabase 프로젝트 생성 필요
> 1. https://supabase.com 접속 → New Project 생성
> 2. Project Settings → API에서 URL과 anon key 복사
> 3. `.env.local` 파일 생성 후 복사한 값 입력

- [ ] **Step 1: 마이그레이션 파일 작성**

`supabase/migrations/001_initial.sql` 생성:

```sql
-- 반 테이블
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year int NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at timestamptz DEFAULT now()
);

-- 교사 테이블 (이메일 화이트리스트)
CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
);

-- 학생 테이블
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_number text UNIQUE NOT NULL,
  name text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  google_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 배움일지 테이블
CREATE TABLE journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  core_content text NOT NULL,
  questions text NOT NULL,
  todays_task text NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

-- 피드백 테이블
CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid UNIQUE NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- 교사 판별 함수
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM teachers
    WHERE email = auth.jwt() ->> 'email'
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- 학생 본인 ID 반환 함수
CREATE OR REPLACE FUNCTION my_student_id()
RETURNS uuid AS $$
  SELECT id FROM students
  WHERE google_user_id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS 정책: classes
CREATE POLICY "교사만 반 관리" ON classes
  FOR ALL USING (is_teacher());
CREATE POLICY "인증 사용자 반 읽기" ON classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS 정책: teachers
CREATE POLICY "교사 본인 읽기" ON teachers
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- RLS 정책: students
CREATE POLICY "교사 전체 학생 접근" ON students
  FOR ALL USING (is_teacher());
CREATE POLICY "학생 본인 읽기" ON students
  FOR SELECT USING (google_user_id = auth.uid());
CREATE POLICY "학생 본인 google_user_id 업데이트" ON students
  FOR UPDATE USING (id = my_student_id() OR is_teacher());

-- RLS 정책: journals
CREATE POLICY "교사 전체 배움일지 읽기" ON journals
  FOR SELECT USING (is_teacher());
CREATE POLICY "학생 본인 배움일지 읽기" ON journals
  FOR SELECT USING (student_id = my_student_id());
CREATE POLICY "학생 배움일지 작성" ON journals
  FOR INSERT WITH CHECK (student_id = my_student_id());

-- RLS 정책: feedbacks
CREATE POLICY "교사 피드백 작성/수정" ON feedbacks
  FOR ALL USING (is_teacher());
CREATE POLICY "학생 본인 피드백 읽기" ON feedbacks
  FOR SELECT USING (
    journal_id IN (
      SELECT id FROM journals WHERE student_id = my_student_id()
    )
  );
```

- [ ] **Step 2: Supabase SQL 에디터에서 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 전체 붙여넣기 → Run

Expected: 에러 없이 테이블 5개 생성 확인 (Table Editor에서 확인)

- [ ] **Step 3: 교사 이메일 등록**

SQL Editor에서 실행 (선생님 본인 이메일 입력):
```sql
INSERT INTO teachers (email, name) VALUES ('your-email@gmail.com', '선생님 이름');
```

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema and RLS policies"
```

---

## Task 3: Supabase 클라이언트 + 인증 미들웨어

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/auth.ts`, `middleware.ts`

- [ ] **Step 1: 브라우저용 클라이언트 작성**

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: 서버용 클라이언트 작성**

`lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 3: 인증 헬퍼 작성**

`lib/auth.ts`:
```ts
import { createClient } from '@/lib/supabase/server'

export async function isTeacher(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const { data } = await supabase
    .from('teachers')
    .select('id')
    .eq('email', user.email)
    .single()
  return !!data
}

export async function getLinkedStudent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('google_user_id', user.id)
    .single()
  return data
}
```

- [ ] **Step 4: 미들웨어 작성 (라우트 보호)**

`middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 비로그인 사용자는 / 로 리다이렉트
  if (!user && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 교사 전용 라우트 보호 (미들웨어에선 간단히 체크 - 상세 권한은 페이지에서)
  return supabaseResponse
}

export const config = {
  matcher: ['/setup', '/journal', '/my', '/teacher', '/teacher/:path*'],
}
```

- [ ] **Step 5: OAuth 콜백 라우트 작성**

`app/auth/callback/route.ts`:
```ts
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
```

- [ ] **Step 6: Commit**

```bash
git add lib/ middleware.ts app/auth/
git commit -m "feat: add Supabase client setup and auth middleware"
```

---

## Task 4: 랜딩/로그인 페이지 + LoginButton 컴포넌트

**Files:**
- Create: `components/LoginButton.tsx`, `app/page.tsx`
- Test: `__tests__/LoginButton.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/LoginButton.test.tsx`:
```tsx
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
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/LoginButton.test.tsx
```
Expected: FAIL - "Cannot find module"

- [ ] **Step 3: LoginButton 컴포넌트 구현**

`components/LoginButton.tsx`:
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Google로 로그인
    </button>
  )
}
```

- [ ] **Step 4: 랜딩 페이지 구현**

`app/page.tsx`:
```tsx
import LoginButton from '@/components/LoginButton'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-md text-center max-w-sm w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">배움일지</h1>
        <p className="text-gray-500 mb-8 text-sm">수업 후 오늘의 배움을 기록해요</p>
        <LoginButton />
      </div>
    </main>
  )
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

```bash
npx jest __tests__/LoginButton.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/LoginButton.tsx __tests__/
git commit -m "feat: add login page with Google OAuth button"
```

---

## Task 5: 학번 연동 페이지 (/setup)

**Files:**
- Create: `components/SetupForm.tsx`, `app/setup/page.tsx`
- Test: `__tests__/SetupForm.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/SetupForm.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SetupForm from '@/components/SetupForm'

const mockFrom = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom })
}))

describe('SetupForm', () => {
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
})
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/SetupForm.test.tsx
```
Expected: FAIL

- [ ] **Step 3: SetupForm 컴포넌트 구현**

`components/SetupForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetupForm({ userId }: { userId: string }) {
  const [studentNumber, setStudentNumber] = useState('')
  const [student, setStudent] = useState<{ id: string; name: string; google_user_id: string | null } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select('id, name, student_number, google_user_id')
      .eq('student_number', studentNumber)
      .single()

    if (error || !data) {
      setError('등록되지 않은 학번입니다. 선생님에게 문의하세요.')
    } else if (data.google_user_id && data.google_user_id !== userId) {
      setError('이미 연동된 학번입니다. 선생님에게 문의하세요.')
    } else {
      setStudent(data)
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!student) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('students')
      .update({ google_user_id: userId })
      .eq('id', student.id)
    router.push('/journal')
  }

  if (student) {
    return (
      <div className="text-center">
        <p className="text-xl font-semibold mb-2">{student.name} 맞나요?</p>
        <p className="text-gray-500 text-sm mb-6">본인이 맞으면 확인을 눌러주세요</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setStudent(null)} className="px-5 py-2 border rounded-lg text-gray-600">
            아니요
          </button>
          <button onClick={handleConfirm} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg">
            {loading ? '처리 중...' : '맞아요'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-gray-600 mb-4 text-sm">처음 이용 시 학번을 입력해 계정을 연동해 주세요</p>
      <input
        type="text"
        placeholder="학번 입력"
        value={studentNumber}
        onChange={e => setStudentNumber(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-3 text-center text-lg"
      />
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        onClick={handleSearch}
        disabled={loading || !studentNumber}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? '조회 중...' : '확인'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: /setup 페이지 구현**

`app/setup/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLinkedStudent } from '@/lib/auth'
import SetupForm from '@/components/SetupForm'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const student = await getLinkedStudent()
  if (student) redirect('/journal')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm w-full mx-4">
        <h1 className="text-xl font-bold text-gray-800 mb-6 text-center">학번 연동</h1>
        <SetupForm userId={user.id} />
      </div>
    </main>
  )
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

```bash
npx jest __tests__/SetupForm.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/SetupForm.tsx app/setup/ __tests__/SetupForm.test.tsx
git commit -m "feat: add student ID linking page (/setup)"
```

---

## Task 6: 배움일지 작성 페이지 (/journal)

**Files:**
- Create: `components/JournalForm.tsx`, `app/journal/page.tsx`
- Test: `__tests__/JournalForm.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/JournalForm.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JournalForm from '@/components/JournalForm'

const mockInsert = jest.fn().mockResolvedValue({ error: null })
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ insert: mockInsert })
  })
}))

describe('JournalForm', () => {
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
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/JournalForm.test.tsx
```
Expected: FAIL

- [ ] **Step 3: JournalForm 컴포넌트 구현**

`components/JournalForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = { studentId: string; studentName: string; onSubmitted?: () => void }

export default function JournalForm({ studentId, studentName, onSubmitted }: Props) {
  const [form, setForm] = useState({ core_content: '', questions: '', todays_task: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const isValid = form.core_content && form.questions && form.todays_task

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('journals').insert({ student_id: studentId, ...form })
    setDone(true)
    setLoading(false)
    onSubmitted?.()
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-gray-700">배움일지를 제출했어요!</p>
        <button onClick={() => setDone(false)} className="mt-4 text-blue-600 text-sm">
          한 번 더 쓰기
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-gray-500 text-sm">{studentName} 님의 배움일지</p>
      {[
        { key: 'core_content', label: '오늘 배운 핵심 내용', placeholder: '오늘 수업에서 가장 중요하다고 생각한 것을 써주세요' },
        { key: 'questions', label: '궁금한 점 / 달라진 생각', placeholder: '궁금한 점이나 수업 후 생각이 바뀐 점을 써주세요' },
        { key: 'todays_task', label: '오늘의 과제', placeholder: '오늘 해야 할 과제나 실천할 것을 써주세요' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <textarea
            aria-label={label}
            placeholder={placeholder}
            value={form[key as keyof typeof form]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? '제출 중...' : '제출'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: /journal 페이지 구현**

`app/journal/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLinkedStudent, isTeacher } from '@/lib/auth'
import JournalForm from '@/components/JournalForm'
import Link from 'next/link'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const teacher = await isTeacher()
  if (teacher) redirect('/teacher')

  const student = await getLinkedStudent()
  if (!student) redirect('/setup')

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">배움일지 작성</h1>
          <Link href="/my" className="text-sm text-blue-600">내 기록 보기</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <JournalForm studentId={student.id} studentName={student.name} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

```bash
npx jest __tests__/JournalForm.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/JournalForm.tsx app/journal/ __tests__/JournalForm.test.tsx
git commit -m "feat: add journal writing page (/journal)"
```

---

## Task 7: 내 기록 보기 (/my)

**Files:**
- Create: `components/JournalList.tsx`, `app/my/page.tsx`
- Test: `__tests__/JournalList.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/JournalList.test.tsx`:
```tsx
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
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/JournalList.test.tsx
```
Expected: FAIL

- [ ] **Step 3: JournalList 컴포넌트 구현**

`components/JournalList.tsx`:
```tsx
type Journal = {
  id: string
  core_content: string
  questions: string
  todays_task: string
  submitted_at: string
  feedbacks: { content: string }[]
}

export default function JournalList({ journals }: { journals: Journal[] }) {
  return (
    <div className="space-y-4">
      {journals.map(j => (
        <div key={j.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-3">
            {new Date(j.submitted_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">핵심 내용</p>
              <p className="text-sm text-gray-800">{j.core_content}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">궁금한 점 / 달라진 생각</p>
              <p className="text-sm text-gray-800">{j.questions}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">오늘의 과제</p>
              <p className="text-sm text-gray-800">{j.todays_task}</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-600 mb-1">선생님 피드백</p>
            {j.feedbacks.length > 0 ? (
              <p className="text-sm text-gray-800">{j.feedbacks[0].content}</p>
            ) : (
              <p className="text-sm text-gray-400">피드백 대기 중...</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: /my 페이지 구현**

`app/my/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLinkedStudent } from '@/lib/auth'
import JournalList from '@/components/JournalList'
import Link from 'next/link'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const student = await getLinkedStudent()
  if (!student) redirect('/setup')

  const { data: journals } = await supabase
    .from('journals')
    .select('*, feedbacks(*)')
    .eq('student_id', student.id)
    .order('submitted_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">내 배움일지</h1>
          <Link href="/journal" className="text-sm text-blue-600">새로 쓰기</Link>
        </div>
        {journals && journals.length > 0 ? (
          <JournalList journals={journals} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>아직 작성한 배움일지가 없어요</p>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

```bash
npx jest __tests__/JournalList.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/JournalList.tsx app/my/ __tests__/JournalList.test.tsx
git commit -m "feat: add my records page (/my)"
```

---

## Task 8: 교사 대시보드 (/teacher)

**Files:**
- Create: `components/StudentList.tsx`, `components/JournalDetail.tsx`, `app/teacher/page.tsx`
- Test: `__tests__/StudentList.test.tsx`, `__tests__/JournalDetail.test.tsx`

- [ ] **Step 1: StudentList 테스트 작성**

`__tests__/StudentList.test.tsx`:
```tsx
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
```

- [ ] **Step 2: JournalDetail 테스트 작성**

`__tests__/JournalDetail.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JournalDetail from '@/components/JournalDetail'

const mockUpdate = jest.fn().mockResolvedValue({ error: null })
const mockUpsert = jest.fn().mockResolvedValue({ error: null })
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => table === 'feedbacks'
      ? { upsert: mockUpsert }
      : { update: mockUpdate }
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
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

```bash
npx jest __tests__/StudentList.test.tsx __tests__/JournalDetail.test.tsx
```
Expected: FAIL

- [ ] **Step 4: StudentList 컴포넌트 구현**

`components/StudentList.tsx`:
```tsx
'use client'
type Student = { id: string; name: string; student_number: string; hasPending: boolean }
type Props = { students: Student[]; selectedId: string | null; onSelect: (id: string) => void }

export default function StudentList({ students, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-y-auto">
      {students.map(s => (
        <button
          key={s.id}
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
```

- [ ] **Step 5: JournalDetail 컴포넌트 구현**

`components/JournalDetail.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Journal = {
  id: string; core_content: string; questions: string; todays_task: string;
  submitted_at: string; feedbacks: { id?: string; content: string }[]
}

export default function JournalDetail({ journal }: { journal: Journal }) {
  const existing = journal.feedbacks[0]
  const [feedback, setFeedback] = useState(existing?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('feedbacks').upsert(
      { journal_id: journal.id, content: feedback, updated_at: new Date().toISOString() },
      { onConflict: 'journal_id' }
    )
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-gray-400">
        {new Date(journal.submitted_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      {[
        { label: '핵심 내용', value: journal.core_content },
        { label: '궁금한 점 / 달라진 생각', value: journal.questions },
        { label: '오늘의 과제', value: journal.todays_task },
      ].map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{value}</p>
        </div>
      ))}
      <div>
        <p className="text-xs font-medium text-blue-600 mb-1">피드백</p>
        <textarea
          placeholder="피드백 입력..."
          value={feedback}
          onChange={e => { setFeedback(e.target.value); setSaved(false) }}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSave}
          disabled={saving || !feedback}
          className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: TeacherDashboard 먼저 구현 후 /teacher 페이지 구현**

> **주의:** TeacherDashboard(Step 7)를 먼저 생성해야 이 페이지가 빌드됩니다. Step 7을 먼저 완료하세요.

- [ ] **Step 6a: /teacher 페이지 구현**

`app/teacher/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isTeacher } from '@/lib/auth'
import TeacherDashboard from '@/components/TeacherDashboard'
import Link from 'next/link'

export default async function TeacherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  if (!(await isTeacher())) redirect('/')

  const { data: classes } = await supabase.from('classes').select('*').order('name')
  const { data: students } = await supabase
    .from('students')
    .select('*, classes(name), journals(id, feedbacks(id))')
    .order('student_number')

  const studentsWithPending = (students ?? []).map(s => ({
    ...s,
    hasPending: s.journals?.some((j: any) => j.feedbacks.length === 0) ?? false,
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <h1 className="text-lg font-bold text-gray-800">배움일지 대시보드</h1>
        <Link href="/teacher/students" className="text-sm text-blue-600">학생 관리</Link>
      </div>
      <TeacherDashboard classes={classes ?? []} students={studentsWithPending} />
    </main>
  )
}
```

> **참고:** `TeacherDashboard`는 클라이언트 컴포넌트로, 반 탭 선택 + 학생 클릭 + 배움일지 상세 조회 상태를 관리. 아래 Task에서 별도 구현.

- [ ] **Step 7: TeacherDashboard 클라이언트 컴포넌트 구현**

`components/TeacherDashboard.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StudentList from './StudentList'
import JournalDetail from './JournalDetail'

type Class = { id: string; name: string }
type Student = { id: string; name: string; student_number: string; hasPending: boolean; class_id: string }

export default function TeacherDashboard({ classes, students }: { classes: Class[]; students: Student[] }) {
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id ?? '')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [journals, setJournals] = useState<any[]>([])
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null)

  const filteredStudents = students.filter(s => !selectedClass || s.class_id === selectedClass)

  const handleSelectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId)
    setSelectedJournal(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('journals')
      .select('*, feedbacks(*)')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
    setJournals(data ?? [])
  }

  return (
    <div className="flex h-[calc(100vh-61px)]">
      {/* 왼쪽: 반 탭 + 학생 목록 */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="flex border-b overflow-x-auto">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedClass(c.id); setSelectedStudentId(null) }}
              className={`px-4 py-2 text-sm whitespace-nowrap ${selectedClass === c.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <StudentList students={filteredStudents} selectedId={selectedStudentId} onSelect={handleSelectStudent} />
      </div>

      {/* 중간: 배움일지 목록 */}
      <div className="w-72 bg-gray-50 border-r overflow-y-auto">
        {selectedStudentId ? (
          journals.length > 0 ? journals.map(j => (
            <button
              key={j.id}
              onClick={() => setSelectedJournal(j)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-white ${selectedJournal?.id === j.id ? 'bg-white' : ''}`}
            >
              <p className="text-xs text-gray-400">{new Date(j.submitted_at).toLocaleDateString('ko-KR')}</p>
              <p className="text-sm text-gray-700 truncate mt-0.5">{j.core_content}</p>
              {j.feedbacks.length === 0 && (
                <span className="text-xs text-red-500 mt-1 block">미피드백</span>
              )}
            </button>
          )) : (
            <p className="text-center text-gray-400 text-sm py-8">제출된 배움일지가 없어요</p>
          )
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">학생을 선택하세요</p>
        )}
      </div>

      {/* 오른쪽: 상세 + 피드백 */}
      <div className="flex-1 overflow-y-auto">
        {selectedJournal ? (
          <JournalDetail journal={selectedJournal} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            배움일지를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: 테스트 실행 (통과 확인)**

```bash
npx jest __tests__/StudentList.test.tsx __tests__/JournalDetail.test.tsx
```
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add components/StudentList.tsx components/JournalDetail.tsx components/TeacherDashboard.tsx app/teacher/page.tsx __tests__/
git commit -m "feat: add teacher dashboard (/teacher)"
```

---

## Task 9: 학생 관리 페이지 (/teacher/students)

**Files:**
- Create: `components/StudentUpload.tsx`, `components/AddClassForm.tsx`, `app/teacher/students/page.tsx`

- [ ] **Step 1: StudentUpload 컴포넌트 구현**

`components/StudentUpload.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StudentUpload({ classId }: { classId: string }) {
  const [result, setResult] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const rows = text.trim().split('\n').slice(1) // 헤더 제외
    const students = rows.map(row => {
      const [student_number, name] = row.replace(/\r/g, '').split(',').map(s => s.trim())
      return { student_number, name, class_id: classId }
    }).filter(s => s.student_number && s.name)

    const supabase = createClient()
    const { error } = await supabase.from('students').upsert(students, { onConflict: 'student_number' })
    setResult(error ? `오류: ${error.message}` : `${students.length}명 등록 완료`)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">CSV 형식: 학번,이름 (첫 줄은 헤더)</p>
      <input type="file" accept=".csv" onChange={handleFile} className="text-sm" />
      {result && <p className="mt-2 text-sm text-blue-600">{result}</p>}
    </div>
  )
}
```

- [ ] **Step 2: /teacher/students 페이지 구현**

`app/teacher/students/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isTeacher } from '@/lib/auth'
import StudentUpload from '@/components/StudentUpload'
import Link from 'next/link'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  if (!(await isTeacher())) redirect('/')

  const { data: classes } = await supabase.from('classes').select('*, students(*)').order('name')

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">학생 관리</h1>
          <Link href="/teacher" className="text-sm text-blue-600">← 대시보드</Link>
        </div>
        {classes?.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-gray-700 mb-3">{cls.name} ({cls.students?.length ?? 0}명)</h2>
            <StudentUpload classId={cls.id} />
            <div className="mt-4 divide-y">
              {cls.students?.map((s: any) => (
                <div key={s.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">{s.name}</span>
                  <span className="text-gray-400">{s.student_number}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* 반 추가 폼 */}
        <AddClassForm />
      </div>
    </main>
  )
}
```

- [ ] **Step 3: AddClassForm 컴포넌트 별도 파일로 분리**

`components/AddClassForm.tsx`:
```tsx
'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AddClassForm() {
  const [name, setName] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('classes').insert({ name })
    setName('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-semibold text-gray-700 mb-3">반 추가</h2>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="반 이름 (예: 1반)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">추가</button>
      </div>
    </form>
  )
}
```

`app/teacher/students/page.tsx` 최상단 import에 추가 (Step 2에서 이미 작성한 파일에 import 추가):
```tsx
import AddClassForm from '@/components/AddClassForm'
```

> **주의:** Step 2에서 `app/teacher/students/page.tsx` 작성 시 위 import를 파일 상단에 포함하세요. AddClassForm 컴포넌트 구현(Step 3)보다 import를 먼저 쓰면 빌드 오류가 발생하므로, **Step 3을 Step 2 이전에 완료**하거나 import를 나중에 추가하세요.

- [ ] **Step 4: Commit**

```bash
git add components/StudentUpload.tsx components/AddClassForm.tsx app/teacher/students/
git commit -m "feat: add student management page (/teacher/students)"
```

---

## Task 10: Supabase Google OAuth 설정 + Vercel 배포

**사전 작업 (Supabase 대시보드):**

- [ ] **Step 1: Google OAuth 설정**

1. Supabase 대시보드 → Authentication → Providers → Google 활성화
2. [Google Cloud Console](https://console.cloud.google.com) → 새 프로젝트 → OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI 추가:
   - `https://your-project.supabase.co/auth/v1/callback`
4. Client ID, Client Secret을 Supabase Google Provider에 입력

- [ ] **Step 2: Vercel 배포**

1. GitHub에 프로젝트 push
2. [Vercel](https://vercel.com) → New Project → GitHub 연결
3. 환경변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

- [ ] **Step 3: Supabase에 배포 URL 추가**

Supabase 대시보드 → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

- [ ] **Step 4: 전체 동작 확인**

브라우저에서 배포된 URL 접속:
1. Google 로그인 → /setup으로 이동 확인
2. 학번 입력 → 이름 확인 → /journal로 이동 확인
3. 배움일지 작성 → 제출 확인
4. 교사 이메일로 로그인 → /teacher로 이동 확인
5. 학생 클릭 → 배움일지 열람 → 피드백 저장 확인

- [ ] **Step 5: 최종 Commit**

```bash
git add .
git commit -m "feat: complete learning journal system"
```

---

## 전체 테스트 실행

```bash
npx jest --coverage
```

Expected: 모든 테스트 통과, coverage 리포트 확인
