/**
 * Client-side validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

/**
 * Validate full name
 */
export function validateFullName(fullName: string): ValidationResult {
  if (!fullName) {
    return { isValid: false, message: 'Full name is required' };
  }

  if (fullName.length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters long' };
  }

  return { isValid: true };
}

/**
 * Validate registration form
 */
export function validateRegistrationForm(email: string, password: string, fullName: string): ValidationResult {
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;

  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.isValid) return fullNameValidation;

  return { isValid: true };
} 