export async function deltaAnalyze(idea, knownTags = []) {
    const res = await fetch('/api/delta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, knownTags })
    });
    if (!res.ok) throw new Error(`Delta-API Fehler: ${res.status}`);
    return await res.json(); // { tags: [...], comment: '…' }
  }
  