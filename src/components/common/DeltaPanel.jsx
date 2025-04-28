// src/components/common/DeltaPanel.jsx
import { useNavigate } from 'react-router-dom'
import { useTwin } from '../../context/TwinContext'

export default function DeltaPanel() {
  const { state, dispatch } = useTwin()
  const navigate = useNavigate()
  const delta = state.pendingDelta
  if (!delta) return null

  const handleApply = () => {
    // Beispiel: je nach Tag neue Features/Changelog draften
    delta.tags.forEach(tag => {
      if (tag === 'n8n' || tag === 'supabase') {
        dispatch({ type: 'PUSH_CHANGELOG', entry: {
          timestamp: new Date().toISOString(),
          source: 'Delta-Report',
          type: 'Auto-Task',
          message: `Neue Aufgabe für ${tag}: ${delta.comment}`,
          relatedComponent: tag
        }})
      }
    })
    // Delta wurde verarbeitet
    dispatch({ type: 'CLEAR_DELTA' })
  }

  return (
    <div className="fixed right-0 top-16 w-80 bg-white shadow-lg p-4 z-50">
      <h3 className="font-bold text-lg mb-2">⚠️ Delta-Analyse</h3>
      <p className="text-sm mb-1">
        <strong>Betrifft:</strong> {delta.tags.join(', ')}
      </p>
      <p className="text-xs text-gray-600 mb-4">{delta.comment}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {/* Je nach Tag springen wir zur passenden Seite */}
        {delta.tags.includes('system')    && <button onClick={()=>navigate('/system')} className="text-blue-600 underline text-xs">Zur System-Übersicht</button>}
        {delta.tags.includes('features')  && <button onClick={()=>navigate('/features')} className="text-blue-600 underline text-xs">Zur Feature-Matrix</button>}
        {delta.tags.includes('testing')   && <button onClick={()=>navigate('/testing')} className="text-blue-600 underline text-xs">Zu Tests</button>}
        {delta.tags.includes('changelog') && <button onClick={()=>navigate('/changelog')} className="text-blue-600 underline text-xs">Zum Changelog</button>}
      </div>

      <button
        onClick={handleApply}
        className="bg-green-600 text-white px-3 py-1 rounded text-sm w-full"
      >
        📝 Übernehmen
      </button>
    </div>
  )
}
