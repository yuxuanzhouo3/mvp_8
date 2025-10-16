/**
 * Authentication Pages - English Translations
 */

import type { AuthTranslations } from './auth-zh'

export const authTranslationsEn: AuthTranslations = {
  // Login form
  login: {
    title: 'Welcome Back to SiteHub',
    subtitle: 'Sign in to access your favorites and custom sites',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    submitButton: 'Sign In',
    submitting: 'Signing in...',
    noAccount: "Don't have an account?",
    signUpLink: 'Sign Up',
    orContinueWith: 'Or continue with',
    googleButton: 'Continue with Google',
    redirecting: 'Redirecting to Google...',
  },

  // Signup form
  signup: {
    title: 'Join SiteHub',
    subtitle: 'Create an account to unlock all features',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create a password (min 6 characters)',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    agreeTerms: 'I agree to the Terms of Service and Privacy Policy',
    submitButton: 'Sign Up',
    submitting: 'Signing up...',
    hasAccount: 'Already have an account?',
    loginLink: 'Sign In',
    orContinueWith: 'Or continue with',
    googleButton: 'Continue with Google',
    redirecting: 'Redirecting to Google...',
  },

  // Forgot password
  forgotPassword: {
    title: 'Reset Password',
    subtitle: 'Enter your email and we\'ll send you a reset link',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    submitButton: 'Send Reset Link',
    submitting: 'Sending...',
    backToLogin: 'Back to Sign In',
    successMessage: 'Reset link has been sent to your email',
  },

  // Error messages
  errors: {
    invalidEmail: 'Please enter a valid email address',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    nameRequired: 'Name is required',
    termsRequired: 'Please agree to the Terms of Service',
    loginFailed: 'Login failed. Please check your email and password',
    signupFailed: 'Sign up failed. This email may already be registered',
    networkError: 'Network error. Please try again later',
  },

  // Success messages
  success: {
    loginSuccess: 'Login successful!',
    signupSuccess: 'Sign up successful! Welcome to SiteHub',
    passwordResetSent: 'Password reset email has been sent',
  },
}
