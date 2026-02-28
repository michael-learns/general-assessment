import nodemailer from 'nodemailer'
import { hashCode, normalizeEmail, signPayload } from '../../utils/emailVerificationToken'

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ email?: string }>(event)
  const email = body.email?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'A valid email is required' })
  }

  const code = generateCode()
  const normalizedEmail = normalizeEmail(email)
  const pendingToken = signPayload({
    kind: 'email_otp_pending',
    email: normalizedEmail,
    codeHash: hashCode(normalizedEmail, code, config),
    exp: Date.now() + 10 * 60 * 1000
  }, config)

  const smtpHost = config.smtpHost?.trim()
  const smtpUser = config.smtpUser?.trim()
  const smtpPass = config.smtpPass?.trim()
  const smtpFrom = config.smtpFrom?.trim()
  const smtpPort = Number(config.smtpPort || 587)

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    if (import.meta.dev) {
      return { ok: true, devCode: code, pendingToken }
    }
    throw createError({ statusCode: 500, message: 'Email service is not configured.' })
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  })

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: 'Your one-time verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
  })

  return { ok: true, pendingToken }
})
