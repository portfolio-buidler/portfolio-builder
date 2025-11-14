import React from 'react'
import type { LoginViewProps } from './Login.types'
import './Login.styles.scss'

export const LoginView: React.FC<LoginViewProps> = ({
  email,
  password,
  showPassword,
  error,
  isLoading,
  hasPendingUpload,
  isFormValid,
  onEmailChange,
  onPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onBack,
  onForgotPassword,
  onGoogleSignIn,
  onSignUpClick,
  backgroundUrl,
}) => {
  return (
    <div
      className="login-page"
      style={{ ['--login-bg' as any]: `url(${backgroundUrl})` }}
    >
      {/* Logo fixed at top-left of viewport - outside container */}
      <h1 className="login-page__logo">Portify.</h1>

      <div className="login-page__container">
        <div className="login-page__form-container">
          <h2 className="login-page__title">
            <button
              type="button"
              className="login-page__back-btn"
              onClick={onBack}
              aria-label="Go back"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            Login
          </h2>
          <p className="login-page__subtitle">
            {error ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="login-page__subtitle__error-icon">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                <span className="login-page__subtitle--error">{error}</span>
              </>
            ) : hasPendingUpload 
              ? 'Login to continue with your upload' 
              : <span className="login-page__subtitle--normal">Welcome back!</span>}
          </p>

          {hasPendingUpload && !error && (
            <div className="login-page__info-banner" role="status">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="login-page__info-icon">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M10 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 13V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="login-page__info-text">Your CV is ready to upload after login</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="login-page__form">
            <div className="login-page__input-group">
              <input
                type="email"
                id="login-email"
                className={`login-page__input ${error ? 'login-page__input--error' : ''}`}
                placeholder="Email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                aria-label="Email address"
                aria-invalid={!!error}
              />
            </div>

            <div className="login-page__input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                className={`login-page__input login-page__input--password ${error ? 'login-page__input--error' : ''}`}
                placeholder="Password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                aria-label="Password"
                aria-invalid={!!error}
              />
            </div>

            <div className="login-page__options">
              <label className="login-page__checkbox">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={onShowPasswordToggle}
                  disabled={isLoading}
                />
                <span className="login-page__checkbox-label">Show password</span>
              </label>

              <button
                type="button"
                className="login-page__forgot-password"
                onClick={onForgotPassword}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="button"
              className="login-page__google-btn"
              onClick={onGoogleSignIn}
              disabled={isLoading}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="login-page__google-icon">
                <path
                  fill="#4285F4"
                  d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"
                />
                <path
                  fill="#34A853"
                  d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45c-.86.58-1.97.92-3.46.92-2.65 0-4.92-1.8-5.73-4.22H1.06v2.52C2.72 17.75 6.09 20 10 20z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.27 11.83c-.2-.58-.31-1.2-.31-1.83s.11-1.25.31-1.83V5.65H1.06C.39 6.98 0 8.44 0 10s.39 3.02 1.06 4.35l3.21-2.52z"
                />
                <path
                  fill="#EA4335"
                  d="M10 3.98c1.5 0 2.85.52 3.91 1.53l2.91-2.91C15.11.89 12.85 0 10 0 6.09 0 2.72 2.25 1.06 5.65l3.21 2.52C5.08 5.78 7.35 3.98 10 3.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="submit"
              className={`login-page__submit-btn ${isFormValid && !isLoading ? 'login-page__submit-btn--ready' : ''}`}
              disabled={isLoading}
            >
              <span className="login-page__submit-label">
                {isLoading ? 'Loading...' : 'Next'}
              </span>
              {!isLoading && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="login-page__submit-icon">
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            <div className="login-page__signup-link">
              <span className="login-page__signup-text">Not a user? </span>
              <button
                type="button"
                className="login-page__signup-btn"
                onClick={onSignUpClick}
                disabled={isLoading}
              >
                Sign-Up here!
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
