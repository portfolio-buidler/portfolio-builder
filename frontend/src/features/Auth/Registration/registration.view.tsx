import React, { useEffect, useRef } from 'react'
import type { RegistrationViewProps } from './Registration.types.ts'
import './Registration.styles.scss'

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  showPassword,
  errors,
  isLoading,
  hasPendingUpload,
  isFormValid,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onBack,
  onLoginClick,
  backgroundUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--registration-bg', `url(${backgroundUrl})`)
    }
  }, [backgroundUrl])

  return (
    <div
      ref={containerRef}
      className="registration-page"
    >
      {/* Logo fixed at top-left of viewport - outside container */}
      <h1 className="registration-page__logo">Portify.</h1>

      <div className="registration-page__container">
        <div className="registration-page__form-container">
          <h2 className="registration-page__title">
            <button
              type="button"
              className="registration-page__back-btn"
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
            Registration
          </h2>
          <p className="registration-page__subtitle">
            {hasPendingUpload 
              ? 'Create an account to continue with your upload' 
              : <span className="registration-page__subtitle--normal">Create your account</span>}
          </p>

          {hasPendingUpload && (
            <div className="registration-page__info-banner" role="status">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="registration-page__info-icon">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M10 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 13V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="registration-page__info-text">Your CV is ready to upload after registration</span>
            </div>
          )}

          {errors.general && (
            <div className="registration-page__error" role="alert">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="registration-page__error-icon">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M10 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="10" cy="14" r="1" fill="currentColor" />
              </svg>
              <span className="registration-page__error-text">{errors.general}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="registration-page__form">
            <div className="registration-page__name-row">
              <div className="registration-page__input-group">
                <input
                  type="text"
                  id="registration-first-name"
                  className={`registration-page__input ${errors.firstName ? 'registration-page__input--error' : ''}`}
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => onFirstNameChange(e.target.value)}
                  disabled={isLoading}
                  autoComplete="given-name"
                  aria-label="First name"
                />
              </div>

              <div className="registration-page__input-group">
                <input
                  type="text"
                  id="registration-last-name"
                  className={`registration-page__input ${errors.lastName ? 'registration-page__input--error' : ''}`}
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => onLastNameChange(e.target.value)}
                  disabled={isLoading}
                  autoComplete="family-name"
                  aria-label="Last name"
                />
              </div>
            </div>

            <div className="registration-page__input-group">
              <input
                type="email"
                id="registration-email"
                className={`registration-page__input ${errors.email ? 'registration-page__input--error' : ''}`}
                placeholder="Email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                aria-label="Email address"
              />
            </div>

            <div className="registration-page__input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="registration-password"
                className={`registration-page__input registration-page__input--password ${
                  errors.password ? 'registration-page__input--error' : ''
                }`}
                placeholder="Password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                aria-label="Password"
              />
            </div>

            {/* Password hint message moved here between password and confirm password */}
            <p className="registration-page__password-hint">
              At least 8 characters, including a letter and a number.
            </p>

            <div className="registration-page__input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="registration-confirm-password"
                className={`registration-page__input registration-page__input--confirm ${
                  errors.confirmPassword ? 'registration-page__input--error' : ''
                }`}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                aria-label="Confirm password"
              />
            </div>

            <label className="registration-page__checkbox">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={onShowPasswordToggle}
                disabled={isLoading}
              />
              <span className="registration-page__checkbox-label">Show password</span>
            </label>

            <button
              type="submit"
              className={`registration-page__submit-btn ${isFormValid && !isLoading ? 'registration-page__submit-btn--ready' : ''}`}
              disabled={isLoading}
            >
              <span className="registration-page__submit-label">
                {isLoading ? 'Creating account...' : 'Next'}
              </span>
              {!isLoading && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="registration-page__submit-icon">
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

            <div className="registration-page__login-link">
              <span className="registration-page__login-text">Already have an account? </span>
              <button
                type="button"
                className="registration-page__login-btn"
                onClick={onLoginClick}
                disabled={isLoading}
              >
                Login here
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
