type PersistedAssessmentSession = {
  sessionId: string
  companyName: string
  industry: string
  product: string
  stage: 'scope' | 'chat' | 'report'
}

const LEGACY_STORAGE_KEY = 'payroll_session'

function getStorageKey(product: string) {
  return `assessment_session_${product}`
}

export function useAssessmentSession(product: string) {
  function loadSession(): PersistedAssessmentSession | null {
    if (!import.meta.client) return null

    try {
      const stored = localStorage.getItem(getStorageKey(product)) || localStorage.getItem(LEGACY_STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored) as Partial<PersistedAssessmentSession>
      if (!parsed?.sessionId || !parsed?.companyName || !parsed?.industry) return null
      if (parsed.product && parsed.product !== product) return null

      return {
        sessionId: parsed.sessionId,
        companyName: parsed.companyName,
        industry: parsed.industry,
        product: parsed.product || product,
        stage: parsed.stage || 'chat'
      }
    } catch {
      return null
    }
  }

  function saveSession(session: PersistedAssessmentSession) {
    if (!import.meta.client) return

    try {
      localStorage.setItem(getStorageKey(product), JSON.stringify(session))
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(session))
    } catch {
      // localStorage unavailable
    }
  }

  function clearSession() {
    if (!import.meta.client) return

    try {
      localStorage.removeItem(getStorageKey(product))
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      // localStorage unavailable
    }
  }

  return { loadSession, saveSession, clearSession }
}
