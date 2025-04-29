// src/components/common/NextUpPanel.jsx
import React, { useEffect, useState } from 'react';
import { fetchNextUp } from '../../api/nextup';

export default function NextUpPanel() {
  const [nextUp, setNextUp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNextUp()
      .then(data => setNextUp(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg p-4 z-50">
      <h3 className="font-bold text-lg mb-2">🚀 What’s Next?</h3>
      {loading && <p className="text-sm text-gray-500">Lade...</p>}
      {error && <p className="text-sm text-red-600">Fehler: {error}</p>}
      {!loading && !error && nextUp.length === 0 && (
        <p className="text-sm text-gray-500">Keine anstehenden Items.</p>
      )}
      {!loading && !error && nextUp.length > 0 && (
        <ol className="list-decimal list-inside text-sm space-y-1 max-h-64 overflow-y-auto">
          {nextUp.slice(0, 5).map(item => (
            <li key={item.id}>
              <strong>{item.title}</strong> ({item.prio}, {item.status})
              {item.prodDate 
                ? ` – Deploy am ${new Date(item.prodDate).toLocaleDateString()}`
                : ''}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
