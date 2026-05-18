/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('leases', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('org_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    t.uuid('property_id').notNullable().references('id').inTable('properties').onDelete('RESTRICT');
    t.uuid('tenant_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.date('start_date').notNullable();
    t.date('end_date').nullable();
    t.decimal('monthly_rent', 10, 2).notNullable();
    t.decimal('deposit_amount', 10, 2).notNullable().defaultTo(0);
    t.enum('status', ['active', 'terminated', 'pending']).notNullable().defaultTo('pending');
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('leases');
};
