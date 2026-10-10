import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://twtcstrnyomwilqtkhwf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_53Gl9SyjeTjIgOalh5o45A_c6XwVHn1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkSupabaseConnection(): Promise<{ connected: boolean; tablesFound: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('patients').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet in Supabase schema
      if (error.code === '42P01' || error.message.includes('schema cache') || error.message.includes('relation') || error.code === 'PGRST205') {
        return {
          connected: true,
          tablesFound: false,
          message: 'Supabase connected! Schema tables have not been created yet in the SQL editor.'
        };
      }
      return {
        connected: false,
        tablesFound: false,
        message: `Supabase error: ${error.message}`
      };
    }
    return {
      connected: true,
      tablesFound: true,
      message: 'Supabase connected and tables active!'
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesFound: false,
      message: err?.message || 'Connection failed'
    };
  }
}
