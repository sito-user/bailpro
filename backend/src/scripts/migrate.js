const knex = require('knex');
const knexfile = require('../../../knexfile');

async function runMigrations() {
  const db = knex(knexfile.production);
  try {
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runMigrations();
