// File: src/api/gptClient.js

export async function askGPT(prompt, chatHistory) {
  const res = await fetch('/api/gpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, chatHistory }),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`GPT-API Fehler: ${res.status} – ${JSON.stringify(json)}`)
  }
  // json: { eventDetected, eventType, data, chatResponse, suggestionId }
  return json
}
