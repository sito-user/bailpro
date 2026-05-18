/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('rent_payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('org_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    t.uuid('lease_id').notNullable().references('id').inTable('leases').onDelete('RESTRICT');
    t.decimal('amount', 10, 2).notNullable();
    t.date('due_date').notNullable();
    t.timestamp('paid_at').nullable();
    t.enum('status', ['pending', 'paid', 'late']).notNullable().defaultTo('pending');
    t.string('payment_method', 50).nullable();
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('rent_payments');
};
