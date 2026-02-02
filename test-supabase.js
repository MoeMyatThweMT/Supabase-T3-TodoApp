import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://arrzufibsxlginirqxsx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycnp1ZmliczN4bGdpbmlycXhzeCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM4NDczNDAwLCJleHAiOjE5OTYxNDk0MDB9.Bp3dEcN5wl9ZjzFJAZ0hKMvBaOqKXKR3s-8MdQQN3os'
)

// Test auth
const { data, error } = await supabase.auth.admin.listUsers()
console.log('Supabase connection test:', { data, error })
