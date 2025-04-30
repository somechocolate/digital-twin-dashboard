// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.SUPABASE_URL
const supabaseAnon = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in env')
}

export const supabase = createClient(supabaseUrl, supabaseAnon)
