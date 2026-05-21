/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.alterTable('properties', (t) => {
    t.enum('type', ['appartement', 'villa', 'magasin', 'bureau', 'entrepot', 'autre'])
      .notNullable()
      .defaultTo('appartement')
      .after('address');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.alterTable('properties', (t) => {
    t.dropColumn('type');
  });
};
