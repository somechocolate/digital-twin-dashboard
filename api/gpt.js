// File: /api/gpt.js
import { Configuration, OpenAIApi } from 'openai'

/** Konfiguration der OpenAI-Bibliothek */
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
if (!configuration.apiKey) {
  console.error('❌ Missing OPENAI_API_KEY in environment')
}

const openai = new OpenAIApi(configuration)

export default async function handler(req, res) {
  try {
    // Nur POST erlaubt
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed` })
    }

    const { prompt, chatHistory } = req.body

    // Payload-Validierung
    if (typeof prompt !== 'string' || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    // Debug-Logs
    console.log('📩 GPT request, prompt:', prompt)
    console.log('📜 Chat history length:', chatHistory.length)

    // System-Prompt (optional ergänzen)
    const systemMessage = `
Du bist eine integrierte Entwicklungs-, Produkt- und Dokumentations-Assistenz.
Analysiere den Chatverlauf + User-Eingabe, 
erkenne neue Systeme, Features oder Komponenten.
Antworte IMMER als JSON:
{
  "eventDetected": <true|false>,
  "eventType": <"system"|"feature"|"component"|null>,
  "data": { … },
  "chatResponse": "<normale Chat-Antwort>"
}
Fülle nur dokumentierte Felder, keine Fantasie-Werte.
    `.trim()

    const messages = [
      // falls Du noch einen System-Prompt verwenden willst, aktiviere die nächste Zeile:
      // { role: 'system', content: systemMessage },
      ...chatHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt },
    ]

    // Chat-Completion anfragen
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: 0,
    })

    const fullText = completion.data.choices?.[0]?.message?.content || ''
    console.log('📨 GPT raw response:', fullText)

    // JSON-Parsing der GPT-Antwort
    let payload
    try {
      // Erwartet reines JSON, kein ```json-Block
      payload = JSON.parse(fullText)
    } catch (err) {
      console.error('⚠️ Could not JSON.parse GPT response:', err)
      return res
        .status(502)
        .json({ error: 'Invalid JSON from GPT', raw: fullText })
    }

    // Endgültige Antwort ans Frontend
    return res.status(200).json({
      eventDetected: payload.eventDetected,
      eventType:    payload.eventType,
      data:         payload.data,
      chatResponse: payload.chatResponse,
    })
  } catch (err) {
    console.error('🔥 /api/gpt handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
