// Datei: /api/gpt.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, chatHistory } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Du bist ein hilfreicher Assistent.' },
          ...chatHistory,
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';

    res.status(200).json({ summary });
  } catch (err) {
    console.error('Error in /api/gpt:', err);
    res.status(500).json({ error: 'Server Error' });
  }
}