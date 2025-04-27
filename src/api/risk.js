export async function rateRisk(title, description = '') {
    const res = await fetch('/api/risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    if (!res.ok) throw new Error(`Risk-API Fehler: ${res.status}`);
    return await res.json(); // { risk, reason }
  }
  