// migrations/20250812100000_create_workers_and_user_workers.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // workers jadvali
  await knex.schema.createTable("workers", (table) => {
    table.increments("id").primary();
    table.text("name").notNullable();
    table.integer("coins_per_hour").notNullable();
    table.integer("price").notNullable();
  });

  // user_workers jadvali
  await knex.schema.createTable("user_workers", (table) => {
    table.increments("id").primary();
    table
      .bigInteger("user_id")
      .notNullable()
      .references("telegram_id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("worker_id")
      .notNullable()
      .references("id")
      .inTable("workers")
      .onDelete("CASCADE");
    table.integer("quantity").notNullable().defaultTo(1);
    table.timestamp("last_collected").notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("user_workers");
  await knex.schema.dropTableIfExists("workers");
};
