/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('org_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    t.string('email', 255).notNullable();
    t.string('password_hash', 255).notNullable();
    t.enum('role', ['admin', 'gestionnaire', 'locataire']).notNullable().defaultTo('locataire');
    t.string('full_name', 255).notNullable();
    t.string('phone', 30).nullable();
    t.timestamps(true, true);
    t.unique(['org_id', 'email']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('users');
};
