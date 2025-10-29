import React from 'react'
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
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onBack,
  backgroundUrl,
}) => {
  return (
    <div
      className="registration-page"
      style={{ ['--registration-bg' as any]: `url(${backgroundUrl})` }}
    >
      <div className="registration-page__container">
        <h1 className="registration-page__logo">Portify.</h1>

        <div className="registration-page__form-container">
          <button
            type="button"
            className="registration-page__back-btn"
            onClick={onBack}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <h2 className="registration-page__title">Registration</h2>
          <p className="registration-page__subtitle">
            At least 8 characters, including a letter and a number.
          </p>

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
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <span className="registration-page__field-error" role="alert">
                    {errors.firstName}
                  </span>
                )}
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
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <span className="registration-page__field-error" role="alert">
                    {errors.lastName}
                  </span>
                )}
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
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <span className="registration-page__field-error" role="alert">
                  {errors.email}
                </span>
              )}
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
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <span className="registration-page__field-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

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
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <span className="registration-page__field-error" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
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
              className="registration-page__submit-btn"
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
          </form>
        </div>
      </div>
    </div>
  )
}