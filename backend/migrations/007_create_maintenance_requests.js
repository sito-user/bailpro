/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable('maintenance_requests', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('org_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    t.uuid('property_id').notNullable().references('id').inTable('properties').onDelete('RESTRICT');
    t.uuid('tenant_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.string('title', 255).notNullable();
    t.text('description').nullable();
    t.enum('priority', ['low', 'medium', 'high', 'urgent']).notNullable().defaultTo('medium');
    t.enum('status', ['open', 'in_progress', 'resolved', 'closed']).notNullable().defaultTo('open');
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('maintenance_requests');
};
