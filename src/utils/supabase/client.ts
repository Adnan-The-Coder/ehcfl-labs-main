/** biome-ignore-all lint/style/noNonNullAssertion: will look into while refactoring */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'URL not set';
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'Key not set';


export const supabase = createClient(supabaseUrl, supabaseKey)