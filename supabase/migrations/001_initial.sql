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
