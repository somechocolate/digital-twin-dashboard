import { supabase } from '../lib/supabaseClient'

export async function getTests() {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .order('feature', { ascending: true })
  if (error) throw error
  return data
}

export async function addTest(test) {
  const { data, error } = await supabase
    .from('tests')
    .insert(test)
    .single()
  if (error) throw error
  return data
}

export async function updateTest(id, changes) {
  const { data, error } = await supabase
    .from('tests')
    .update(changes)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteTest(id) {
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
