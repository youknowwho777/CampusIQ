// Student Academic Dashboard matching CampusIQ visual design template
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import campusHeroImg from '../../assets/images/campus_hero_illustration.png';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await studentService.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading-spinner">
        <div className="spinner-ring"></div>
        <p>Loading academic snapshot...</p>
      </div>
    );
  }

  const { student, stats, courses, upcoming } = dashboardData || {};

  return (
    <div className="student-dashboard">
      {/* 1. Hero Banner Section */}
      <section className="dashboard-hero-banner">
        <div className="hero-content">
          <span className="hero-greeting-sub">Good Evening,</span>
          <div className="hero-name-row">
            <h1 className="hero-greeting-name">{student?.firstName || 'Sophia'}!</h1>
            {/* Golden 3-Ray Accent \ | / */}
            <div className="hero-sparkle-rays" aria-hidden="true">
              <span className="ray ray-1"></span>
              <span className="ray ray-2"></span>
              <span className="ray ray-3"></span>
            </div>
          </div>
          <p className="hero-description">Here's your academic snapshot for this semester.</p>
        </div>

        {/* Scenic University Campus Building Art */}
        <div className="hero-illustration-wrapper" aria-hidden="true">
          <img
            src={campusHeroImg}
            alt="University Campus Building"
            className="hero-campus-image"
          />
        </div>
      </section>

      {/* 2. Academic Stat Metric Cards (Row of 4) */}
      <section className="dashboard-stats-grid">
        {/* Card 1: Attendance */}
        <div className="stat-card stat-attendance">
          <div className="stat-card-header">
            <div className="stat-icon-box icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>
            <div className="stat-meta">
              <span className="stat-label">Attendance</span>
              <div className="stat-value-row">
                <span className="stat-number">{stats?.attendance?.value || '92%'}</span>
                <span className="stat-trend-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  {stats?.attendance?.change || '+2%'}
                </span>
              </div>
            </div>
          </div>
          <div className="stat-bottom-accent-bar bar-green"></div>
        </div>

        {/* Card 2: Current CGPA */}
        <div className="stat-card stat-cgpa">
          <div className="stat-card-header">
            <div className="stat-icon-box icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="stat-meta">
              <span className="stat-label">Current CGPA</span>
              <div className="stat-value-row">
                <span className="stat-number">{stats?.cgpa?.value || '8.72'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Credits Earned */}
        <div className="stat-card stat-credits">
          <div className="stat-card-header">
            <div className="stat-icon-box icon-amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="stat-meta">
              <span className="stat-label">Credits Earned</span>
              <div className="stat-value-row">
                <span className="stat-number">{stats?.credits?.display || '54 / 60'}</span>
              </div>
            </div>
          </div>
          <div className="stat-progress-track">
            <div
              className="stat-progress-fill fill-amber"
              style={{ width: `${stats?.credits?.progressPercent || 90}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Pending Tasks */}
        <div className="stat-card stat-tasks">
          <div className="stat-card-header">
            <div className="stat-icon-box icon-peach">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M12 14h.01" />
              </svg>
            </div>
            <div className="stat-meta">
              <span className="stat-label">Pending Tasks</span>
              <div className="stat-value-row">
                <span className="stat-number">{stats?.pendingTasks?.count || 3}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Lower Split Grid: My Courses (Left) & Upcoming (Right) */}
      <section className="dashboard-main-grid">
        {/* Left Card: My Courses (This Semester) */}
        <div className="dashboard-content-card courses-card">
          <div className="card-top-bar">
            <div className="card-title-group">
              <svg className="card-header-icon green-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <h2 className="card-main-title">My Courses <span className="card-subtitle-tag">(This Semester)</span></h2>
            </div>
            <Link to="/courses" className="card-action-link">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="courses-list-stack">
            {courses?.map((course) => (
              <div key={course.code} className="course-item-row">
                {/* Course Icon */}
                <div className={`course-badge-icon course-icon-${course.iconType}`}>
                  {course.iconType === 'code' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  )}
                  {course.iconType === 'database' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  )}
                  {course.iconType === 'monitor' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  )}
                  {course.iconType === 'cube' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                  )}
                </div>

                {/* Course Code & Name */}
                <div className="course-info-group">
                  <span className="course-code-tag">{course.code}</span>
                  <span className="course-name-label">{course.title}</span>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="course-progress-wrapper">
                  <div className="course-progress-bar-bg">
                    <div
                      className="course-progress-bar-fill"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <span className="course-percentage-text">{course.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Upcoming */}
        <div className="dashboard-content-card upcoming-card">
          <div className="card-top-bar">
            <div className="card-title-group">
              <svg className="card-header-icon green-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h2 className="card-main-title">Upcoming</h2>
            </div>
            <Link to="/courses" className="card-action-link">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="upcoming-timeline">
            {upcoming?.map((item, idx) => (
              <div key={item.id} className="timeline-item-row">
                {/* Timeline connector dot and line */}
                <div className="timeline-axis">
                  <div className={`timeline-node-dot dot-${item.badgeColor}`}></div>
                  {idx < upcoming.length - 1 && <div className="timeline-connector-line"></div>}
                </div>

                {/* Content Box */}
                <div className="timeline-content-box">
                  <div className={`upcoming-type-icon icon-${item.iconType}`}>
                    {item.iconType === 'document' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    )}
                    {item.iconType === 'quiz' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <line x1="8" y1="9" x2="16" y2="9" />
                        <line x1="8" y1="13" x2="14" y2="13" />
                      </svg>
                    )}
                    {item.iconType === 'code' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    )}
                  </div>

                  <div className="upcoming-details">
                    <h3 className="upcoming-title">{item.title}</h3>
                    <span className="upcoming-due-date">{item.dueDateText}</span>
                  </div>

                  <div className={`upcoming-badge-pill pill-${item.badgeColor}`}>
                    {item.badgeText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
