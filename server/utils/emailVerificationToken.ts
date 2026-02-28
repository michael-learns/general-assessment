import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

type PendingPayload = {
  kind: 'email_otp_pending'
  email: string
  codeHash: string
  exp: number
}

type VerifiedPayload = {
  kind: 'email_otp_verified'
  email: string
  exp: number
}

type VerificationPayload = PendingPayload | VerifiedPayload

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url')
}

function fromB64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function getSecret(config: ReturnType<typeof useRuntimeConfig>): string {
  const base = config.geminiApiKey || 'local-dev-secret'
  return `email-otp:${base}`
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hashCode(email: string, code: string, config: ReturnType<typeof useRuntimeConfig>): string {
  return createHash('sha256')
    .update(`${normalizeEmail(email)}:${code.trim()}:${getSecret(config)}`)
    .digest('hex')
}

export function signPayload(payload: VerificationPayload, config: ReturnType<typeof useRuntimeConfig>): string {
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac('sha256', getSecret(config)).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyPayload(token: string, config: ReturnType<typeof useRuntimeConfig>): VerificationPayload | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expected = createHmac('sha256', getSecret(config)).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null

  try {
    const payload = JSON.parse(fromB64url(body)) as VerificationPayload
    if (!payload || !payload.email || !payload.exp || !payload.kind) return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

