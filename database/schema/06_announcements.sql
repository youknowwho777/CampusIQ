-- Database Schema: Institutional Announcements and Circulars
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(20) DEFAULT 'ALL', -- 'ALL', 'STUDENT', 'TEACHER', 'ADMIN'
    category VARCHAR(50) DEFAULT 'GENERAL', -- 'GENERAL', 'ACADEMIC', 'EXAM', 'EVENT', 'URGENT'
    priority VARCHAR(20) DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) DEFAULT 'CampusIQ Administration',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_target_role ON announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
