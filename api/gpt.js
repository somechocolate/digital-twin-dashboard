// File: /api/gpt.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, chatHistory } = req.body;
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
  `.trim();

  try {
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
    });

    const { choices } = await openAiRes.json();
    const content = choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\n([\s\S]*?)```/);

    let payload;
    if (jsonMatch) {
      try {
        payload = JSON.parse(jsonMatch[1]);
      } catch {
        payload = { eventDetected: false, eventType: null, data: {}, chatResponse: content };
      }
    } else {
      payload = { eventDetected: false, eventType: null, data: {}, chatResponse: content };
    }

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error in /api/gpt:', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}
