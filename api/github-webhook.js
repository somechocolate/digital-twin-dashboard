// File: /api/github-webhook.js
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Supabase Admin‐Client (Service Role Key)
const supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KE
)

// Deaktiviere Next.js’ JSON-Parser
export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  // 1) Raw Body manuell einlesen
  const buf = await new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
  const payloadRaw = buf.toString()

  // 2) Signatur‐Header extrahieren
  const sig256 = req.headers['x-hub-signature-256'] || ''
  const sig1   = req.headers['x-hub-signature'] || ''
  const secret = process.env.GITHUB_WEBHOOK_SECRET || ''

  // 3) HMAC berechnen
  const hmac256 = crypto.createHmac('sha256', secret).update(payloadRaw).digest('hex')
  const hmac1   = crypto.createHmac('sha1',   secret).update(payloadRaw).digest('hex')
  const exp256  = `sha256=${hmac256}`
  const exp1    = `sha1=${hmac1}`

  // 4) Debug-Logs
  console.log('GitHub→sig256:', sig256, 'expected→', exp256)
  console.log('GitHub→sig1:  ', sig1,   'expected→', exp1)

  // 5) Timing-safe Compare
  let valid = false
  if (sig256) {
    const a = Buffer.from(sig256)
    const b = Buffer.from(exp256)
    valid = a.length === b.length && crypto.timingSafeEqual(a, b)
  } else if (sig1) {
    const a = Buffer.from(sig1)
    const b = Buffer.from(exp1)
    valid = a.length === b.length && crypto.timingSafeEqual(a, b)
  }

  if (!valid) {
    console.error('❌ Invalid signature, aborting webhook')
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
    // 7) Logge das Roh-Event
    await supabaseAdmin
      .from('github_events')
      .insert([{ event_type: eventType, payload }])

    // 8) Changelog-Entry (für AI-Flow)
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
    console.error('🛑 Error in /api/github-webhook:', err)
    return res.status(500).json({ error: err.message })
  }
}
