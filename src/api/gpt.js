// Datei: src/api/gpt.js
 
export async function askGPT(prompt, chatHistory) {
  const res = await fetch('/api/gpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, chatHistory })
  });

  if (!res.ok) throw new Error(`GPT-API Fehler: ${res.status}`);
  
  return await res.json(); // { summary }
}