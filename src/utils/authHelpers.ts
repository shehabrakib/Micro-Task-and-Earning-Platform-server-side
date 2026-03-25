import type { UserRole } from '../types/auth'

export const getStartingCoinByRole = (role: UserRole): number => {
  if (role === 'worker') return 10
  if (role === 'buyer') return 50
  return 0
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
