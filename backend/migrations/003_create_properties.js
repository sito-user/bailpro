/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('properties', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('org_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    t.text('address').notNullable();
    t.string('district', 100).nullable();
    t.decimal('surface_m2', 8, 2).nullable();
    t.decimal('rent_amount', 10, 2).notNullable();
    t.enum('status', ['available', 'occupied', 'maintenance']).notNullable().defaultTo('available');
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('properties');
};
