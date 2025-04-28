import { supabase } from '../lib/supabaseClient'

// liefert alle Features
export async function getFeatures() {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .order('dev_date', { ascending: true })
  if (error) throw error
  return data
}

// legt ein neues Feature an
export async function addFeature(feature) {
  const { data, error } = await supabase
    .from('features')
    .insert(feature)
    .single()
  if (error) throw error
  return data
}

// updated Feld(e) des Features mit id
export async function updateFeature(id, changes) {
  const { data, error } = await supabase
    .from('features')
    .update(changes)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// löscht ein Feature
export async function deleteFeature(id) {
  const { error } = await supabase
    .from('features')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
