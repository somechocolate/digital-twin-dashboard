// File: /api/nextup.js
import { supabase } from '../lib/supabaseClient';  // wir nehmen den Anon-Client

export default async function handler(req, res) {
  try {
    // Hol dir bis zu 10 Einträge aus der View
    const { data, error } = await supabase
      .from('next_up')
      .select('*')
      .limit(10);

    if (error) throw error;
    return res.status(200).json({ nextUp: data });
  } catch (err) {
    console.error('Error in /api/nextup:', err);
    return res.status(500).json({ error: err.message });
  }
}
