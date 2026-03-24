# 배움일지 시스템 설계 문서

**날짜:** 2026-03-24
**작성자:** Claude (brainstorming session)

---

## 개요

고등학교 교사가 학생들의 배움일지를 수집하고 개별 피드백을 제공하는 웹 애플리케이션. 2~3개 반, 60~90명 규모를 대상으로 하며 무료 인프라(Vercel + Supabase)로 운영 가능.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js (App Router) |
| 배포 | Vercel (무료 플랜) |
| 백엔드/DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth + Google OAuth |
| 스타일 | Tailwind CSS |

---

## 사용자 역할

- **학생**: Google 계정으로 로그인, 배움일지 작성, 본인 피드백 확인
- **교사**: Google 계정으로 로그인 (이메일 화이트리스트로 구분), 전체 학생 배움일지 열람 및 피드백 작성, 학생 목록 관리
- **향후 확장**: 교사별 담당 반 권한 분리 (초기 버전에선 미구현)

---

## 데이터베이스 스키마

### `classes` (반)
```sql
id          uuid PRIMARY KEY
name        text  -- 예: "1반", "2반"
year        int   -- 학년도
created_at  timestamptz
```

### `students` (학생)
```sql
id             uuid PRIMARY KEY
student_number text UNIQUE  -- 학번
name           text
class_id       uuid REFERENCES classes(id)
google_user_id uuid REFERENCES auth.users(id)  -- 첫 로그인 시 연동
created_at     timestamptz
```

### `journals` (배움일지)
```sql
id            uuid PRIMARY KEY
student_id    uuid REFERENCES students(id)
core_content  text  -- 오늘 배운 핵심 내용
questions     text  -- 궁금한 점 / 달라진 생각
todays_task   text  -- 오늘의 과제
submitted_at  timestamptz DEFAULT now()
```

### `feedbacks` (교사 피드백)
```sql
id         uuid PRIMARY KEY
journal_id uuid REFERENCES journals(id) UNIQUE
content    text
created_at timestamptz DEFAULT now()
updated_at timestamptz
```

### `teachers` (교사)
```sql
id         uuid PRIMARY KEY
email      text UNIQUE  -- Google 계정 이메일 (화이트리스트)
name       text
created_at timestamptz
```

### Row Level Security (RLS)
- 학생: 본인 `student_id`에 해당하는 journals/feedbacks만 읽기 가능, 본인 journal 쓰기 가능
- 교사: 전체 journals 읽기, feedbacks 쓰기/수정 가능
- 학생 목록(students/classes): 교사만 쓰기 가능

---

## 페이지 구성

### 학생 화면

#### `/` — 랜딩 / 로그인
- Google 로그인 버튼

#### `/setup` — 최초 1회 학번 연동
- 학번 입력 → 등록된 학생 이름 표시 ("박지호 맞나요?")
- 확인 시 `students.google_user_id`에 현재 구글 계정 연동
- 이미 연동된 계정이면 자동으로 `/journal`로 리다이렉트

#### `/journal` — 배움일지 작성
- 3개 항목 입력 폼:
  1. 오늘 배운 핵심 내용
  2. 궁금한 점 / 달라진 생각
  3. 오늘의 과제
- 제출 시각 자동 기록
- 하루 여러 번 제출 허용 (날짜별로 그룹화하여 표시)

#### `/my` — 내 기록 보기
- 제출 날짜별로 그룹된 배움일지 목록
- 각 항목 클릭 시 상세 내용 + 교사 피드백 확인

### 교사 화면

#### `/teacher` — 대시보드
- 반 선택 탭
- 왼쪽: 학생 목록 (미피드백 학생 강조 표시)
- 오른쪽: 선택한 학생의 배움일지 목록 → 클릭 시 상세 + 피드백 입력창
- 피드백 저장 버튼

#### `/teacher/students` — 학생 관리
- 반 추가/삭제
- CSV 일괄 업로드 (학번, 이름, 반)
- 개별 학생 추가/삭제

---

## 사용자 흐름

### 학생 최초 등록 흐름
```
1. Google 로그인
2. /setup 페이지 → 학번 입력
3. "박지호 맞나요?" 이름 확인
4. 확인 클릭 → google_user_id 연동 완료
5. /journal로 이동
- 이미 다른 계정에 연동된 학번 입력 시: "이미 연동된 학번입니다. 선생님에게 문의하세요." 오류 표시
```

### 학생 이후 로그인 흐름
```
1. Google 로그인
2. google_user_id로 students 조회 → 연동 확인
3. /journal 바로 이동 (학번 입력 불필요)
```

### 교사 피드백 흐름
```
1. Google 로그인 (이메일 화이트리스트 확인)
2. /teacher 대시보드
3. 반 선택 → 학생 목록 확인
4. 미피드백 학생 클릭 → 배움일지 열람
5. 피드백 작성 → 저장
```

---

## 교사 인증 방식

- Supabase의 별도 `teachers` 테이블에 허용 이메일 목록 관리
- Google 로그인 후 이메일이 `teachers` 테이블에 있으면 교사 권한 부여
- 없으면 학생 흐름으로 진행

---

## 향후 확장 계획

- 교사별 담당 반 권한 분리 (teacher_classes 조인 테이블)
- 반별/날짜별 통계 (미제출자 현황 등)
- 피드백 알림 (이메일 or 브라우저 푸시)

---

## 비용

| 서비스 | 플랜 | 예상 사용량 | 한도 |
|--------|------|-------------|------|
| Vercel | 무료 | - | 충분 |
| Supabase DB | 무료 | ~10MB/년 | 500MB |
| Supabase Auth | 무료 | 90명 | 50,000 MAU |

90명 규모, 수년간 무료 플랜으로 운영 가능.
