// File: /api/github-webhook.js

import { buffer } from 'micro'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Supabase Admin-Client (Service-Role-Key)
const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KE
)

// Deaktiviere den Body-Parser, damit wir den Raw-Body holen können
export const config = {
  api: { bodyParser: false }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  // 1) Raw-Body einlesen
  const buf = await buffer(req)
  const payloadRaw = buf.toString()

  // 2) Lese beide Header (sha1 + sha256)
  const sigSha256 = req.headers['x-hub-signature-256']
  const sigSha1   = req.headers['x-hub-signature']

  // 3) Berechne hmac-sha1 & sha256
  const secret = process.env.GITHUB_WEBHOOK_SECRET || ''
  const hmac256 = crypto.createHmac('sha256', secret).update(payloadRaw).digest('hex')
  const hmac1   = crypto.createHmac('sha1',   secret).update(payloadRaw).digest('hex')

  const expected256 = `sha256=${hmac256}`
  const expected1   = `sha1=${hmac1}`

  // 4) Debug-Logs für Signature
  console.log('GitHub Signature-256:', sigSha256, ' expected256:', expected256)
  console.log('GitHub Signature(sha1):', sigSha1,   ' expected1:',   expected1)

  // 5) Timing-safe Compare je nachdem, welcher Header gesetzt ist
  let valid = false
  if (sigSha256) {
    const sigBuf = Buffer.from(sigSha256)
    const expBuf = Buffer.from(expected256)
    valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)
  } else if (sigSha1) {
    const sigBuf = Buffer.from(sigSha1)
    const expBuf = Buffer.from(expected1)
    valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)
  }

  if (!valid) {
    console.error('Invalid signature, aborting')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // 6) JSON parsen
  let payload
  try {
    payload = JSON.parse(payloadRaw)
  } catch {
    return res.status(400).json({ error: 'Malformed JSON' })
  }

  const eventType = req.headers['x-github-event'] || 'unknown'

  try {
    // 7) Roh-Event loggen
    await supabaseAdmin
      .from('github_events')
      .insert([{ event_type: eventType, payload }])

    // 8) Changelog-Entry anlegen
    await supabaseAdmin
      .from('changes')
      .insert([{
        source: 'github',
        type: eventType,
        message: `GitHub Event: ${eventType}`,
        relatedComponentId: null
      }])

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Error in /api/github-webhook:', err)
    return res.status(500).json({ error: err.message })
  }
}
