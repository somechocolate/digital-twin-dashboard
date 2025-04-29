// File: /api/github-webhook.js

import { createClient } from '@supabase/supabase-js'

// Nutze hier den Service-Role Key für Schreibrechte auf alle Tabellen
const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // 1️⃣ GitHub-Event-Typ auslesen
  const eventType = req.headers['x-github-event'] || 'unknown'

  // 2️⃣ Payload (JSON) aus dem Body
  const payload = req.body

  try {
    // 3️⃣ Logge das Roh-Event
    await supabaseAdmin
      .from('github_events')
      .insert([{ event_type: eventType, payload }])

    // 4️⃣ Schreibe einen Changelog-Eintrag
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
