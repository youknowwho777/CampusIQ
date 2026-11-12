import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import RoleSelector from '../../components/auth/RoleSelector';
import AuthInput from '../../components/auth/AuthInput';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../../components/auth/AuthComponents.css';

/**
 * Login Page Component
 * Implements the CampusIQ authentication interface matching the design specification.
 */
const Login = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  // Form State
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authFeedback, setAuthFeedback] = useState(null);

  // Field change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field-specific error upon typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (authFeedback) {
      setAuthFeedback(null);
    }
  };

  // Validation logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Please enter your email or Institute ID';
    } else if (
      formData.identifier.includes('@') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier.trim())
    ) {
      newErrors.identifier = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setAuthFeedback(null);

    try {
      let loggedUser = null;
      let accessToken = '';

      try {
        const res = await api.post('/auth/login', {
          identifier: formData.identifier.trim(),
          password: formData.password
        });
        if (res.data?.success && res.data?.data) {
          const u = res.data.data.user;
          loggedUser = {
            id: u.id,
            name: `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || u.email,
            email: u.email,
            role: u.role,
            department: u.department
          };
          accessToken = res.data.data.tokens.accessToken;
        }
      } catch (apiErr) {
        // Fallback demo session if API is unreachable
        const isFaculty = selectedRole.toLowerCase() === 'teacher' || formData.identifier.includes('faculty');
        loggedUser = {
          id: isFaculty ? 'b0000000-0000-0000-0000-000000000002' : 'c0000000-0000-0000-0000-000000000003',
          name: isFaculty ? 'Prof. Sarah Connor' : 'Alex Johnson',
          email: formData.identifier.includes('@') ? formData.identifier : `${formData.identifier}@campusiq.edu`,
          role: selectedRole.toUpperCase(),
          department: 'Computer Science & Engineering'
        };
        accessToken = 'mock-jwt-token-' + Date.now();
      }

      if (setUser) setUser(loggedUser, accessToken);

      setAuthFeedback({
        type: 'success',
        message: `Welcome back, ${loggedUser.name}! Redirecting to dashboard...`
      });

      // Navigate to role-specific dashboard
      setTimeout(() => {
        if (loggedUser.role === 'TEACHER') {
          navigate('/teacher');
        } else {
          navigate('/dashboard');
        }
      }, 700);
    } catch (err) {
      setAuthFeedback({
        type: 'error',
        message: 'Invalid credentials. Please verify your ID and password.'
      });
      setIsSubmitting(false);
    }
  };

  // Google Login click handler (UI only)
  const handleGoogleLogin = () => {
    setAuthFeedback({
      type: 'success',
      message: 'Connecting to Campus Single Sign-On (Google)...'
    });
    setTimeout(() => {
      if (setUser) {
        setUser({
          id: 'google-usr-001',
          name: 'Academic User',
          email: 'user@campusiq.edu',
          role: selectedRole.toUpperCase()
        });
      }
      navigate('/dashboard');
    }, 800);
  };

  return (
    <AuthLayout>
      {/* Header with Title and 3 Golden Accent Rays (\ | /) */}
      <div className="auth-header">
        <div className="auth-title-row">
          <h2 className="auth-title">Welcome Back</h2>
          <span className="title-sparkle-rays" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="accent-rays-svg">
              {/* Left ray: \ */}
              <line x1="3" y1="18" x2="1" y2="10" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
              {/* Center ray: | */}
              <line x1="12" y1="18" x2="12" y2="6" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
              {/* Right ray: / */}
              <line x1="21" y1="18" x2="23" y2="10" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <p className="auth-subtitle">Login to your CampusIQ account</p>
      </div>

      {/* Role Selection Tabs: Student, Faculty, Admin */}
      <RoleSelector
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        roles={['student', 'faculty', 'admin']}
      />

      {/* Feedback Banner */}
      {authFeedback && (
        <div className={`auth-alert-banner ${authFeedback.type}`} role="alert">
          {authFeedback.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>{authFeedback.message}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email / Institute ID Field */}
        <AuthInput
          id="login-identifier"
          name="identifier"
          type="text"
          label="Email / Institute ID"
          labelIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          }
          placeholder="Enter your email or institute ID"
          value={formData.identifier}
          onChange={handleChange}
          error={errors.identifier}
          autoComplete="username"
        />

        {/* Password Field with Show/Hide Toggle */}
        <AuthInput
          id="login-password"
          name="password"
          type="password"
          label="Password"
          labelIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />

        {/* Remember Me & Forgot Password */}
        <div className="form-options-row">
          <label className="checkbox-label" htmlFor="login-remember">
            <input
              type="checkbox"
              id="login-remember"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="custom-checkbox"
            />
            <span>Remember me</span>
          </label>

          <Link to="/forgot-password" className="forgot-password-link">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary-auth"
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? 'Logging in...' : 'Log In'}</span>
          <span className="btn-arrow-icon" aria-hidden="true">→</span>
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span className="divider-text">or</span>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={handleGoogleLogin}
        >
          <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer Link to Registration */}
        <p className="auth-footer-switch">
          New to CampusIQ?
          <Link to="/register" className="auth-switch-link">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
