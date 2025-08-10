// migrations/20250814_create_duel_history_table.js
exports.up = function (knex) {
  return knex.schema.createTable("duel_history", function (table) {
    table.increments("id").primary();
    table.bigInteger("player1_id").notNullable();
    table.bigInteger("player2_id").notNullable();
    table.integer("duel_count").defaultTo(1); // shu juftlik necha marta o'ynadi
    table.timestamp("first_played_at").defaultTo(knex.fn.now()); // birinchi o'ynagan vaqti
    table.timestamp("last_played_at").defaultTo(knex.fn.now()); // oxirgi duel vaqti
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("duel_history");
};
