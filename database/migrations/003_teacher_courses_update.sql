-- Migration 003: Associate teachers and sections directly with courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'Sec A';
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
