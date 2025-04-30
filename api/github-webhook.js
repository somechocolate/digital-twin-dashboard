// File: /api/github-webhook.js
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// 1) Direkt mal Env-Vars ausgeben, um sicherzugehen, dass sie da sind:
console.log('▹ REACT_APP_SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('▹ REACT_APP_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌ MISSING')
console.log('▹ GITHUB_WEBHOOK_SECRET:', process.env.GITHUB_WEBHOOK_SECRET ? '✅' : '❌ MISSING')

// Supabase Admin‐Client (Service Role Key)
let supabaseAdmin
try {
  supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
  )
} catch (e) {
  console.error('Failed to init Supabase Admin client:', e)
}



// Deaktiviere Next.js’ JSON-Parser
export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  console.log('🔥 Handler entered, method=', req.method)
  if (!supabaseAdmin) {
    console.error('No supabaseAdmin available, aborting')
    return res.status(500).send('Server misconfiguration')
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  // 1) Raw Body manuell einlesen
  let buf
  try {
    buf = await new Promise((resolve, reject) => {
      const chunks = []
      req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })
  } catch (e) {
    console.error('Error reading body:', e)
    return res.status(400).send('Bad Request')
  }
  const payloadRaw = buf.toString()

  // 2) Signatur‐Header extrahieren
  const sig256 = req.headers['x-hub-signature-256'] || ''
  const sig1 = req.headers['x-hub-signature'] || ''
  const secret = process.env.GITHUB_WEBHOOK_SECRET || ''

  // 3) HMAC berechnen
  const hmac256 = crypto.createHmac('sha256', secret).update(payloadRaw).digest('hex')
  const hmac1 = crypto.createHmac('sha1', secret).update(payloadRaw).digest('hex')
  const exp256 = `sha256=${hmac256}`
  const exp1 = `sha1=${hmac1}`

  // 4) Debug-Logs
  console.log('GitHub→sig256:', sig256, 'expected→', exp256)
  console.log('GitHub→sig1:  ', sig1, 'expected→', exp1)

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

  // Wenn alles ok, logge in Supabase
  try {
    const eventType = req.headers['x-github-event'] || 'unknown'
    console.log('→ Logging GitHub event:', eventType)
    await supabaseAdmin.from('github_events').insert([{ eventType, payload: JSON.parse(payloadRaw) }])
    await supabaseAdmin.from('changes').insert([{ source: 'github', type: eventType, message: `GitHub Event: ${eventType}`, relatedComponentId: null }])
    // ❷ Jetzt Delta-Analyse anstoßen:
    let newSuggestions = []
    try {
      const deltaRes = await fetch(
        `${process.env.VERCEL_URL || ''}/api/delta`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: req.body, knownTags: [] })
        }
      )
      newSuggestions = (await deltaRes.json()).suggestions
    } catch (err) {
      console.error('Delta-Analyse im Webhook fehlgeschlagen:', err)
    }

    // ❸ Vorschläge in supabase ’suggestions’ table schreiben
    for (const s of newSuggestions) {
      await supabaseAdmin
        .from('suggestions')
        .insert([{
          entityType: s.entityType,
          data: s.data,
          status: 'open'
        }])
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Error inserting into Supabase:', err)
    return res.status(500).json({ error: err.message })
  }

}
