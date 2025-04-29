// File: /api/nextup.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('next_up')
      .select('*')
      .limit(10);
    if (error) throw error;
    res.status(200).json({ nextUp: data });
  } catch (err) {
    console.error('Error in /api/nextup:', err);
    res.status(500).json({ error: err.message });
  }
}
