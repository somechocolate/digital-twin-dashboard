import dayjs from 'dayjs'
import { useTwin } from '../../context/TwinContext'

export default function FeatureMatrix({ features, updateFeature }) {
  // Widget „Days till next deployment“
  const today = dayjs()
  const nextDate = key => {
    const nxt = features
      .map(f => f[key]).filter(Boolean)
      .map(d => dayjs(d)).filter(d => d.isAfter(today))
      .sort((a,b)=>a-b)[0]
    return nxt ? `${nxt.diff(today,'day')} d → ${nxt.format('DD.MM')}` : '—'
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold text-xl mb-2">🧩 Feature-Matrix</h2>

      <p className="text-xs text-gray-500 mb-2">
        🗓️ Next Dev: <strong>{nextDate('devDate')}</strong> ·
        Next Prod: <strong>{nextDate('prodDate')}</strong>
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {['Feature','Status','Prio','Risiko','Komplexität','Zieldatum (Dev)','Zieldatum (Prod)']
              .map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {features.map((f,i)=>(
            <tr key={i} className="border-b">
              <td>{f.title}</td>
              <td>
                <select
                  value={f.status}
                  onChange={e=>updateFeature(i,'status',e.target.value)}
                >
                  <option>Geplant</option>
                  <option>In Dev</option>
                  <option>Abgeschlossen</option>
                </select>
              </td>
              <td>
                <select
                  value={f.prio}
                  onChange={e=>updateFeature(i,'prio',e.target.value)}
                >
                  <option>Niedrig</option>
                  <option>Mittel</option>
                  <option>Hoch</option>
                </select>
              </td>
              <td>{f.risk}</td>
              <td>
                <select
                  value={f.complexity}
                  onChange={e=>updateFeature(i,'complexity',e.target.value)}
                >
                  <option>Niedrig</option>
                  <option>Mittel</option>
                  <option>Hoch</option>
                </select>
              </td>
              <td>
                <input
                  type="date"
                  className="border px-2 py-1 rounded"
                  value={f.devDate||''}
                  onChange={e=>updateFeature(i,'devDate',e.target.value)}
                />
              </td>
              <td>
                <input
                  type="date"
                  className="border px-2 py-1 rounded"
                  value={f.prodDate||''}
                  onChange={e=>updateFeature(i,'prodDate',e.target.value)}
                />
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
