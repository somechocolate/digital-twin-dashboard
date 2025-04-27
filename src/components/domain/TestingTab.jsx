import React from 'react'

export default function TestingTab({ tests, setTests }) {
  const updateStatus = (index, newStatus) => {
    const copy = [...tests]
    copy[index] = {
      ...copy[index],
      status: newStatus,
      lastRun: new Date().toISOString(),
    }
    setTests(copy)
  }

  return (
    <div className="bg-white p-4 rounded shadow space-y-6">
      <h2 className="font-bold text-xl mb-4">🧪 Testfälle</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th>Feature</th>
            <th>Typ</th>
            <th>Status</th>
            <th>Beschreibung</th>
            <th>Letzter Lauf</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t, i) => (
            <tr key={i} className="border-b">
              <td>{t.feature}</td>
              <td>{t.type}</td>
              <td>{t.status}</td>
              <td>{t.description}</td>
              <td>{t.lastRun ? new Date(t.lastRun).toLocaleString() : '-'}</td>
              <td className="space-x-1">
                <button
                  onClick={() => updateStatus(i, 'Pass')}
                  className="text-green-600"
                >
                  ✅
                </button>
                <button
                  onClick={() => updateStatus(i, 'Fail')}
                  className="text-red-500"
                >
                  ❌
                </button>
                <button
                  onClick={() => updateStatus(i, 'Pending')}
                  className="text-gray-500"
                >
                  ⏳
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
