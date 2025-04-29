// File: src/components/domain/NextUp.jsx
import React, { useEffect, useState } from 'react';
import { fetchNextUp } from '../../api/nextup';

export default function NextUp() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNextUp()
      .then(data => setList(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading Next-Up…</p>;
  if (!list.length) return <p>Keine anstehenden Items.</p>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold text-xl mb-2">🚀 What’s Next?</h2>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        {list.slice(0,3).map(item => (
          <li key={item.id}>
            <strong>{item.title}</strong> ({item.prio}, {item.status})
            {item.prodDate 
              ? ` – Deploy am ${new Date(item.prodDate).toLocaleDateString()}`
              : ''}
          </li>
        ))}
      </ol>
    </div>
  );
}
