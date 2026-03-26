// 개발 모드 전용 목업 데이터 — 프로덕션에선 절대 사용되지 않음
export const DEV_PREVIEW = process.env.NODE_ENV === 'development'

export const mockStudent = {
  id: 'dev-stu-1',
  name: '홍길동',
  student_number: '20301',
  class_id: 'dev-class-1',
  google_user_id: 'dev-user-1',
}

export const mockJournals = [
  {
    id: 'dev-j1',
    core_content: '소설의 시점에 대해 배웠습니다',
    questions: '1인칭과 3인칭 시점의 차이가 궁금합니다',
    todays_task: '교과서 p.45 시점 분석 문제 풀기',
    submitted_at: '2026-03-24T10:00:00Z',
    feedbacks: [{ content: '잘 이해했네요! 시점에 따라 독자의 감정이입이 달라진다는 점도 생각해보세요.' }],
  },
  {
    id: 'dev-j2',
    core_content: '운율의 종류와 특징',
    questions: '자유시와 정형시의 경계가 모호할 때는 어떻게 판단하나요?',
    todays_task: '좋아하는 시 한 편 골라 운율 분석하기',
    submitted_at: '2026-03-21T10:00:00Z',
    feedbacks: [],
  },
]

export const mockClasses = [
  { id: 'dev-class-1', name: '1반', year: 2026, created_at: '2026-03-01T00:00:00Z' },
  { id: 'dev-class-2', name: '2반', year: 2026, created_at: '2026-03-01T00:00:00Z' },
]

export const mockStudentsWithPending = [
  { id: 'dev-stu-1', name: '홍길동', student_number: '20301', class_id: 'dev-class-1', hasPending: true },
  { id: 'dev-stu-2', name: '김민준', student_number: '20302', class_id: 'dev-class-1', hasPending: false },
  { id: 'dev-stu-3', name: '이서연', student_number: '20303', class_id: 'dev-class-2', hasPending: true },
  { id: 'dev-stu-4', name: '박지호', student_number: '20304', class_id: 'dev-class-2', hasPending: false },
]

export const mockClassesWithStudents = [
  {
    id: 'dev-class-1',
    name: '1반',
    students: [
      { id: 'dev-stu-1', name: '홍길동', student_number: '20301' },
      { id: 'dev-stu-2', name: '김민준', student_number: '20302' },
    ],
  },
  {
    id: 'dev-class-2',
    name: '2반',
    students: [
      { id: 'dev-stu-3', name: '이서연', student_number: '20303' },
      { id: 'dev-stu-4', name: '박지호', student_number: '20304' },
    ],
  },
]
