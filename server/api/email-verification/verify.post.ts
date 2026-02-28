import { hashCode, normalizeEmail, signPayload, verifyPayload } from '../../utils/emailVerificationToken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ email?: string; code?: string; pendingToken?: string }>(event)
  const email = body.email?.trim()
  const code = body.code?.trim()
  const pendingToken = body.pendingToken?.trim()

  if (!email || !code || !pendingToken) {
    throw createError({ statusCode: 400, message: 'Email, code, and pending token are required.' })
  }

  const payload = verifyPayload(pendingToken, config)
  if (!payload || payload.kind !== 'email_otp_pending') {
    throw createError({ statusCode: 400, message: 'Verification request is invalid or expired. Send a new code.' })
  }

  const normalizedEmail = normalizeEmail(email)
  if (payload.email !== normalizedEmail) {
    throw createError({ statusCode: 400, message: 'Email does not match the verification request.' })
  }

  const codeHash = hashCode(normalizedEmail, code, config)
  if (codeHash !== payload.codeHash) {
    throw createError({ statusCode: 400, message: 'Invalid verification code.' })
  }

  const verifiedToken = signPayload({
    kind: 'email_otp_verified',
    email: normalizedEmail,
    exp: Date.now() + 60 * 60 * 1000
  }, config)

  return { verified: true, verifiedToken }
})
