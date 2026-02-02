const supabase = require('../config/supabase');

async function checkSchema() {
  console.log('Checking merchants table schema...\n');
  
  // Try to query with created_by to see if column exists
  const { data, error } = await supabase
    .from('merchants')
    .select('id, name, created_by, is_active, created_at')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 The created_by column does NOT exist in the merchants table.');
    console.log('\n📋 Please run this SQL in Supabase SQL Editor:\n');
    console.log(`
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES merchant_portal_users(id);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE merchants SET is_active = true WHERE is_active IS NULL;

UPDATE merchants m
SET created_by = mpu.id
FROM merchant_portal_users mpu
WHERE m.id = mpu.merchant_id
AND m.created_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_merchants_created_by ON merchants(created_by);
    `);
  } else {
    console.log('✅ Schema is correct!');
    console.log('Found columns:', Object.keys(data[0] || {}));
  }
  
  process.exit(0);
}

checkSchema();
