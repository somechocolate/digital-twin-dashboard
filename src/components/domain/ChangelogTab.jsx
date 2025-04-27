import React from 'react'

export default function ChangelogTab({ changelog }) {
  return (
    <div className="bg-white p-4 rounded shadow space-y-6">
      <h2 className="font-bold text-xl mb-4">📜 Changelog</h2>
      <ul className="space-y-4">
        {changelog
          .slice()
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map((log, idx) => (
            <li key={idx} className="border-l-4 border-blue-600 pl-4">
              <p className="text-xs text-gray-400">
                {log.timestamp} · {log.source} · {log.type}
              </p>
              <p className="text-sm mt-1">{log.message}</p>
              <p className="text-xs text-gray-500">
                Komponente: {log.relatedComponent}
              </p>
            </li>
          ))}
      </ul>
    </div>
  )
}
