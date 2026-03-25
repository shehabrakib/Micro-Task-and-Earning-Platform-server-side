export type UserRole = 'worker' | 'buyer' | 'admin'

export interface JwtUserPayload {
  userId: string
  email: string
  role: UserRole
}

export interface RegisterBody {
  name: string
  email: string
  password: string
  photoURL: string
  role: 'worker' | 'buyer'
}

export interface LoginBody {
  email: string
  password: string
}

export interface GoogleAuthBody {
  idToken: string
  role?: 'worker' | 'buyer'
}
