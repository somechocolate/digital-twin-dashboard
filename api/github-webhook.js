// File: /api/github-webhook.js

import { buffer } from 'micro'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Supabase-Admin (Service Role Key)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Für Next.js API-Routen deaktivieren wir JSON-Parsing
export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  // 1) Raw Body einlesen
  const buf = await buffer(req)
  const payloadRaw = buf.toString()

  // 2) HMAC prüfen
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  const signature = req.headers['x-hub-signature-256'] || ''
  const hmac = crypto.createHmac('sha256', secret).update(payloadRaw).digest('hex')
  const expected = `sha256=${hmac}`

  // Timing-safe compare
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (!signature || sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // 3) JSON parsen
  let payload
  try {
    payload = JSON.parse(payloadRaw)
  } catch {
    return res.status(400).json({ error: 'Malformed JSON' })
  }

  const eventType = req.headers['x-github-event'] || 'unknown'

  try {
    // 4) Logge ins GitHub-Events-Log
    await supabaseAdmin
      .from('github_events')
      .insert([{ event_type: eventType, payload }])

    // 5) Schreibe Changelog-Entry (für AI-Optimierung)
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
