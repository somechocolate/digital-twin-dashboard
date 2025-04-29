// /api/gpt.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, chatHistory } = req.body;

  // Kombinierter System-Prompt
  const systemMessage = `
Du bist eine integrierte Entwicklungs-, Produkt- und Dokumentations-Assistenz.
1) Analysiere den Chatverlauf und deine aktuelle User-Nachricht.
2) Erkenne, ob ein neues System, Feature oder eine Komponente dokumentiert werden soll.
3) Gib IMMER eine JSON-Antwort im Code-Block-Format zurück mit diesen Feldern:
   {
     "eventDetected": <true|false>,         // ob dokumentierbares Event
     "eventType": <"system"|"feature"|"component"|null>,
     "data": { … },                         // erkannte Felder, sonst {}
     "chatResponse": "<normale Chat-Antwort als String>"
   }
4) Fülle NIEMALS Daten mit Phantasie-Werten; dokumentiere nur, was der User inhaltlich geliefert hat.
5) Wenn eventDetected=false ist, setze eventType und data auf null bzw. {}.
`.trim();

  try {
    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemMessage },
          ...chatHistory,
          { role: 'user', content: prompt }
        ],
        temperature: 0 // deterministischer
      })
    });

    const { choices } = await openAiRes.json();
    const content = choices?.[0]?.message?.content || '';

    // Extrahiere JSON-Block
    const jsonMatch = content.match(/```json\n([\s\S]*?)```/);
    let payload;
    try {
      payload = jsonMatch 
        ? JSON.parse(jsonMatch[1]) 
        : { eventDetected: false, eventType: null, data: {}, chatResponse: content };
    } catch {
      // Fallback bei fehlerhaftem JSON
      payload = { eventDetected: false, eventType: null, data: {}, chatResponse: content };
    }

    return res.status(200).json(payload);

  } catch (err) {
    console.error('Error in /api/gpt:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
}
