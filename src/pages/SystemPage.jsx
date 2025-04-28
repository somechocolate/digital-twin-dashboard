import { useEffect } from 'react'
import { useTwin } from '../context/TwinContext'
import supabase from '../lib/supabaseClient'
import SystemEditor from '../components/domain/SystemEditor'

export default function SystemPage() {
  const { state, dispatch } = useTwin()

  // 1️⃣ Lade Komponenten beim Mount
  useEffect(() => {
    supabase
      .from('systemComponents')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else dispatch({ type: 'SET_SYSTEM_COMPONENTS', payload: data })
      })
  }, [dispatch])

  // 2️⃣ Speichern (insert/update)
  const onSaveComponent = async (component) => {
    let res
    if (component.id) {
      res = await supabase
        .from('systemComponents')
        .update(component)
        .eq('id', component.id)
    } else {
      res = await supabase
        .from('systemComponents')
        .insert(component)
        .single()
    }
    if (res.error) console.error(res.error)
    else dispatch({ type: 'UPSERT_SYSTEM_COMPONENT', payload: res.data })
  }

  // 3️⃣ Löschen
  const onDeleteComponent = async (id) => {
    const { error } = await supabase
      .from('systemComponents')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
    else dispatch({ type: 'DELETE_SYSTEM_COMPONENT', payload: id })
  }

  return (
    <SystemEditor
      components={state.systemComponents}
      onSave={onSaveComponent}
      onDelete={onDeleteComponent}
    />
  )
}
