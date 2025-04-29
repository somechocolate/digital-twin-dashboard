// File: src/api/nextup.js
export async function fetchNextUp() {
    const res = await fetch('/api/nextup');
    if (!res.ok) throw new Error(`NextUp-API Fehler: ${res.status}`);
    const { nextUp } = await res.json();
    return nextUp;
  }
  