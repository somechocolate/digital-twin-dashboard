import { useEffect } from 'react'
import { useTwin } from '../context/TwinContext'
import { supabase } from '../lib/supabaseClient'
import TestingTab from '../components/domain/TestingTab'

export default function TestingPage() {
  const { state, dispatch } = useTwin()

  // 1️⃣ Tests laden
  useEffect(() => {
    supabase
      .from('tests')
      .select('*')
      .order('feature', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else dispatch({ type: 'SET_TESTS', payload: data })
      })
  }, [dispatch])

  // 2️⃣ Test anlegen
  const onAddTest = async (test) => {
    const { data, error } = await supabase
      .from('tests')
      .insert(test)
      .single()
    if (error) console.error(error)
    else dispatch({ type: 'ADD_TEST', payload: data })
  }

  // 3️⃣ Test updaten
  const onUpdateTest = async (id, updates) => {
    const { data, error } = await supabase
      .from('tests')
      .update(updates)
      .eq('id', id)
      .single()
    if (error) console.error(error)
    else dispatch({ type: 'UPDATE_TEST', payload: data })
  }

  // 4️⃣ Test löschen
  const onDeleteTest = async (id) => {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
    else dispatch({ type: 'DELETE_TEST', payload: id })
  }

  return (
    <TestingTab
      tests={state.tests}
      onAdd={onAddTest}
      onUpdate={onUpdateTest}
      onDelete={onDeleteTest}
    />
  )
}
