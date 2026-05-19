require('dotenv').config();
const knex = require('knex');
const knexfile = require('../../knexfile');

async function runDemoSeed() {
  const env = process.env.NODE_ENV || 'development';
  const db = knex(knexfile[env]);

  try {
    console.log('Running demo seed...');
    const seed = require('../../seeds/demo');
    await seed.seed(db);
    console.log('Demo seed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runDemoSeed();
