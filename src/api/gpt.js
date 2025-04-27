export async function askGPT(prompt, mode) {
    const res = await fetch('/api/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode })
    });
    if (!res.ok) throw new Error(`GPT-API Fehler: ${res.status}`);
    return await res.json(); // { summary, modeUsed }
  }
  