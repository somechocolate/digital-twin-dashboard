// api/delta.js
import { Configuration, OpenAIApi } from 'openai'

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const { idea, knownTags = [] } = req.body

  // Baue deinen Prompt
  const systemPrompt = `
    Du bist ein Analyse-Assistent für Produkt-Ideen.
    Gegeben: Idee = "${idea}"
    Bekannte Tags = ${knownTags.join(', ')}
    Liefere ein JSON-Objekt {"suggestions":[{entityType:string, data:object},…]}.
  `

  try {
    const aiRes = await openai.createChatCompletion({
      model: 'gpt-4',
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: idea }
      ]
    })
    // Extrahiere das JSON aus der KI-Antwort
    const text = aiRes.data.choices[0].message.content
    const { suggestions } = JSON.parse(text)

    return res.status(200).json({ suggestions })
  } catch (err) {
    console.error('Delta-Route Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
