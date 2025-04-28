import { supabase } from '../lib/supabaseClient'

export async function getComponents() {
  const { data, error } = await supabase
    .from('system_components')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function addComponent(comp) {
  const { data, error } = await supabase
    .from('system_components')
    .insert(comp)
    .single()
  if (error) throw error
  return data
}

export async function updateComponent(id, changes) {
  const { data, error } = await supabase
    .from('system_components')
    .update(changes)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteComponent(id) {
  const { error } = await supabase
    .from('system_components')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
