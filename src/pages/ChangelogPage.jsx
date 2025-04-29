import { useEffect } from 'react'
import { useTwin } from '../context/TwinContext'
import { supabase } from '../lib/supabaseClient'
import ChangelogTab from '../components/domain/ChangelogTab'

export default function ChangelogPage() {
  const { state, dispatch } = useTwin()

  // 1️⃣ Logs laden
  useEffect(() => {
    supabase
      .from('changes')
      .select('*')
      .order('timestamp', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else dispatch({ type: 'SET_CHANGELOG', payload: data })
      })
  }, [dispatch])

  // 2️⃣ Neuen Log-Eintrag erstellen
  const onAddLog = async (log) => {
    const { data, error } = await supabase
      .from('changes')
      .insert(log)
      .single()
    if (error) console.error(error)
    else dispatch({ type: 'ADD_LOG', payload: data })
  }

  // 3️⃣ Log-Eintrag aktualisieren
  const onUpdateLog = async (id, updates) => {
    const { data, error } = await supabase
      .from('changes')
      .update(updates)
      .eq('id', id)
      .single()
    if (error) console.error(error)
    else dispatch({ type: 'UPDATE_LOG', payload: data })
  }

  // 4️⃣ Log-Eintrag löschen
  const onDeleteLog = async (id) => {
    const { error } = await supabase
      .from('changes')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
    else dispatch({ type: 'DELETE_LOG', payload: id })
  }

  return (
    <ChangelogTab changelog={state.changelog} />
  )
}
