// File: /api/gpt.js

import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// Supabase-Admin-Client für Vorschlags-Inserts
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY')
    return res
      .status(500)
      .json({ error: 'Server misconfiguration: missing OPENAI_API_KEY' })
  }

  const { prompt, chatHistory } = req.body
  const systemMessage = `
Du bist eine integrierte Entwicklungs-, Produkt- und Dokumentations-Assistenz.
1) Analysiere den Chatverlauf und deine aktuelle User-Nachricht.
2) Erkenne, ob ein neues System, Feature oder eine Komponente angelegt werden soll.
3) Gib IMMER eine JSON-Antwort IMMER IM CODEBLOCK-Format zurück mit:
   {
     "eventDetected": <true|false>,
     "eventType": <"system"|"feature"|"component"|null>,
     "data": { … },
     "chatResponse": "<normale Chat-Antwort>"
   }
4) Fülle NIEMALS Felder mit Fantasiewerten.
Wenn eventDetected=false ist, setze eventType und data auf null bzw. {}.
  `.trim()

  try {
    // 1) Anfrage an OpenAI
    const openAiRes = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemMessage },
            ...chatHistory,
            { role: 'user', content: prompt },
          ],
          temperature: 0,
        }),
      }
    )

    const openAiJson = await openAiRes.json()
    if (!openAiRes.ok) {
      console.error('OpenAI API Error:', openAiRes.status, openAiJson)
      return res.status(openAiRes.status).json({ error: openAiJson })
    }

    // 2) Extrahiere JSON-Block
    const content = openAiJson.choices?.[0]?.message?.content || ''
    const match = content.match(/```json\n([\s\S]*?)```/)
    let payload = { eventDetected: false, eventType: null, data: {}, chatResponse: content }

    if (match) {
      try {
        payload = JSON.parse(match[1])
      } catch (e) {
        console.warn('Could not parse GPT JSON, sending raw chatResponse', e)
      }
    }

    // 3) Wenn GPT ein Feature-Vorschlag erkannt hat, speichere es
    let suggestionId = null
    if (payload.eventDetected && payload.eventType === 'feature') {
      const { data: inserted, error } = await supabaseAdmin
        .from('suggestions')
        .insert([
          {
            entityType: 'feature',
            data: payload.data,
            status: 'open',
            createdAt: new Date().toISOString(),
          },
        ])
        .select('id')
      if (error) {
        console.error('Suggestion Insert Error:', error)
      } else {
        suggestionId = inserted?.[0]?.id
      }
    }

    // 4) Gib nur das Minimal-Payload zurück
    return res.status(200).json({
      ...payload,
      suggestionId,         // damit das Frontend weiß, welchen Datensatz es anzeigen kann
    })
  } catch (err) {
    console.error('Error in /api/gpt.js:', err)
    return res.status(500).json({ error: 'Server Error' })
  }
}
