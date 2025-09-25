import { createClient } from '@supabase/supabase-js'

// Optionally, import your generated types if you ran `supabase gen types`
import type { Database } from '@/types/supabase' 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// If you don’t have generated types yet, just use `any` or omit <Database>
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
