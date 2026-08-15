import { readFileSync } from 'fs';
import { join } from 'path';

console.log('📋 Migration ready to apply');
console.log('');
console.log('🔗 Database: https://vjtwzpnmsdtwmqlsoyos.supabase.co');
console.log('');
console.log('⚠️  MANUAL STEP - Apply the migration:');
console.log('');
console.log('1. Go to: https://supabase.com/dashboard/project/vjtwzpnmsdtwmqlsoyos/sql/new');
console.log('2. Open file: supabase/migrations/20260815000001_initial_schema.sql');
console.log('3. Copy ALL contents and paste into SQL Editor');
console.log('4. Click "Run" button');
console.log('');

const migrationPath = join(process.cwd(), 'supabase/migrations/20260815000001_initial_schema.sql');
const migration = readFileSync(migrationPath, 'utf-8');

console.log(`📄 Migration file: ${migration.split('\n').length} lines, ${migration.length} bytes`);
console.log('');
console.log('After running the SQL, type "done" here and I will continue with Google OAuth setup...');
