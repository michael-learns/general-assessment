const STORAGE_KEY = 'payroll_user_id'

export function useAuth() {
  const userId = useState<string | null>('userId', () => null)

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) userId.value = stored
    } catch {
      // localStorage unavailable (SSR)
    }
  }

  function login(code: string) {
    const trimmed = code.trim().toUpperCase()
    userId.value = trimmed
    localStorage.setItem(STORAGE_KEY, trimmed)
  }

  function logout() {
    userId.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('payroll_session')
    } catch {
      // ignore
    }
  }

  function generateCode(): string {
    // Human-readable code: excludes ambiguous chars (0/O, 1/I/L)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const segment = () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `${segment()}-${segment()}`
  }

  return { userId, loadFromStorage, login, logout, generateCode }
}
