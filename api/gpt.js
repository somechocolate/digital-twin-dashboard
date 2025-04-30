// File: /api/gpt.js
import fetch from 'node-fetch'   // in Vercel/APIs verfügbar
import { createClient } from '@supabase/supabase-js'

// Supabase-Client wird nur in DB-Routinen gebraucht, hier aber nicht
// const supabaseService = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// )

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // 1) Key-Check
  if (!process.env.OPENAI_API_KEY) {
    console.error('🔥 Missing OPENAI_API_KEY')
    return res.status(500).json({ error: 'Server misconfiguration: missing OPENAI_API_KEY' })
  }

  const { prompt, chatHistory } = req.body
  const systemMessage = `
Du bist eine integrierte Entwicklungs-, Produkt- und Dokumentations-Assistenz.
1) Analysiere den Chatverlauf und deine aktuelle User-Nachricht.
2) Erkenne, ob ein neues System, Feature oder eine Komponente angelegt werden soll.
3) Gib IMMER eine JSON-Antwort im Code-Block-Format zurück mit diesen Feldern:
   {
     "eventDetected": <true|false>,
     "eventType": <"system"|"feature"|"component"|null>,
     "data": { … },
     "chatResponse": "<normale Chat-Antwort>"
   }
4) Fülle NIEMALS Felder mit Fantasiewerten; dokumentiere nur, was geliefert wurde.
Wenn eventDetected=false ist, setze eventType und data auf null bzw. {}.
  `.trim()

  try {
    // 2) Request an OpenAI
    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
          { role: 'user', content: prompt }
        ],
        temperature: 0
      })
    })

    const openAiJson = await openAiRes.json()

    // 3) Fehler von OpenAI abfangen
    if (!openAiRes.ok) {
      console.error('🔴 OpenAI API Error:', openAiRes.status, openAiJson)
      // gib die OpenAI-Fehlermeldung an den Client weiter (kannst Du noch verfeinern)
      return res.status(openAiRes.status).json({ error: openAiJson })
    }

    // 4) Code-Block extrahieren
    const content = openAiJson.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/```json\n([\s\S]*?)```/)
    let payload

    if (jsonMatch) {
      try {
        payload = JSON.parse(jsonMatch[1])
      } catch (e) {
        console.warn('⚠️ Could not parse JSON from GPT:', e)
        payload = {
          eventDetected: false,
          eventType: null,
          data: {},
          chatResponse: content
        }
      }
    } else {
      payload = {
        eventDetected: false,
        eventType: null,
        data: {},
        chatResponse: content
      }
    }

    // 5) Auf Wunsch: direkt hier DB-Insert für Vorschläge (alternativ in Webhook o.ä.)
    // if (payload.eventDetected && payload.eventType === 'feature') { … }

    // 6) Antwort an den Client
    return res.status(200).json(payload)

  } catch (err) {
    console.error('🔥 Error in /api/gpt.js:', err)
    return res.status(500).json({ error: 'Server Error' })
  }
}
