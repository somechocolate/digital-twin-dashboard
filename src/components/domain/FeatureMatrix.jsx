// src/components/domain/FeatureMatrix.jsx
import React from 'react'
import dayjs from 'dayjs'

export default function FeatureMatrix({ items = [], updateFeature, onAcceptProposal, onRejectProposal }) {
  // Berechne "Next Date" nur aus echten Features
  const today = dayjs()
  const nextDate = key => {
    const dates = items
      .filter(item => !item.isSuggestion && item[key])
      .map(item => dayjs(item[key]))
      .filter(d => d.isAfter(today))
      .sort((a, b) => a.valueOf() - b.valueOf())
    const nxt = dates[0]
    return nxt ? `${nxt.diff(today, 'day')} d → ${nxt.format('DD.MM')}` : '—'
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold text-xl mb-2">🧩 Feature-Matrix</h2>
      <p className="text-xs text-gray-500 mb-4">
        🗓️ Next Dev: <strong>{nextDate('devDate')}</strong> ·
        Next Prod: <strong>{nextDate('prodDate')}</strong>
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th>Feature</th>
            <th>Quelle</th>
            <th>Status</th>
            <th>Prio</th>
            <th>Risiko</th>
            <th>Komplexität</th>
            <th>Zieldatum (Dev)</th>
            <th>Zieldatum (Prod)</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr
              key={row.id ?? row._tempId}
              className={row.isSuggestion ? 'bg-yellow-50 border-b' : 'border-b'}
            >
              <td>{row.title}</td>
              <td>
                {row.isSuggestion
                  ? <span className="text-xs uppercase font-semibold text-yellow-800">GPT</span>
                  : <span className="text-xs uppercase text-gray-500">User</span>}
              </td>
              <td>
                {row.isSuggestion
                  ? '-'  
                  : (
                    <select
                      value={row.status}
                      onChange={e => updateFeature(i, 'status', e.target.value)}
                    >
                      <option>Geplant</option>
                      <option>In Dev</option>
                      <option>Abgeschlossen</option>
                    </select>
                  )}
              </td>
              <td>
                {row.isSuggestion
                  ? '-'
                  : (
                    <select
                      value={row.prio}
                      onChange={e => updateFeature(i, 'prio', e.target.value)}
                    >
                      <option>Niedrig</option>
                      <option>Mittel</option>
                      <option>Hoch</option>
                    </select>
                  )}
              </td>
              <td>{row.risk}</td>
              <td>
                {row.isSuggestion
                  ? '-'
                  : (
                    <select
                      value={row.complexity}
                      onChange={e => updateFeature(i, 'complexity', e.target.value)}
                    >
                      <option>Niedrig</option>
                      <option>Mittel</option>
                      <option>Hoch</option>
                    </select>
                  )}
              </td>
              <td>
                {row.isSuggestion
                  ? '-'
                  : (
                    <input
                      type="date"
                      className="border px-2 py-1 rounded"
                      value={row.devDate || ''}
                      onChange={e => updateFeature(i, 'devDate', e.target.value)}
                    />
                  )}
              </td>
              <td>
                {row.isSuggestion
                  ? '-'
                  : (
                    <input
                      type="date"
                      className="border px-2 py-1 rounded"
                      value={row.prodDate || ''}
                      onChange={e => updateFeature(i, 'prodDate', e.target.value)}
                    />
                  )}
              </td>
              <td className="space-x-2">
                {row.isSuggestion ? (
                  <>  
                    <button
                      onClick={() => onAcceptProposal(row)}
                      className="text-green-600"
                    >✓</button>
                    <button
                      onClick={() => onRejectProposal(row.suggestionId)}
                      className="text-red-600"
                    >✕</button>
                  </>
                ) : (
                  <button
                    onClick={() => updateFeature(i, 'status', row.status)}
                    className="text-blue-600"
                  >✎</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mt-2">
        * Prod-Datum wird automatisch auf Dev-Datum gezogen, falls es davor liegt.
      </p>
    </div>
  )
}
