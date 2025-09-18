require('dotenv').config();
const { Pool } = require('pg');

// Test different SSL configurations
const configs = [
  {
    name: 'No SSL (disable)',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'inventory_db',
      user: 'postgres',
      password: 'password123',
      ssl: false
    }
  },
  {
    name: 'SSL disabled explicitly',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'inventory_db',
      user: 'postgres',
      password: 'password123',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Default configuration',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'inventory_db',
      user: 'postgres',
      password: 'password123'
    }
  }
];

async function testConfig(configObj) {
  const pool = new Pool(configObj.config);
  
  try {
    console.log(`\n🔄 Testing: ${configObj.name}`);
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user');
    console.log(`✅ ${configObj.name} - SUCCESS`);
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error(`❌ ${configObj.name} - FAILED:`, error.message);
    await pool.end();
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Testing different SSL configurations...');
  
  for (const config of configs) {
    await testConfig(config);
  }
  
  console.log('\n✅ Tests completed');
}

runAllTests();