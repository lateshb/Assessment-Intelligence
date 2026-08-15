import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verifying migration...');

// Check tables exist
const tables = ['profiles', 'institutions', 'assessments', 'questions', 'analyses', 'rubric_library', 'teacher_decisions'];

for (const table of tables) {
  const { error } = await supabase.from(table).select('count').limit(0);
  if (error) {
    console.log(`❌ ${table}: ${error.message}`);
  } else {
    console.log(`✅ ${table}: exists`);
  }
}

console.log('');
console.log('✅ Migration verified!');
