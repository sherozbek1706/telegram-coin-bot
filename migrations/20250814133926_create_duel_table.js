// migrations/20250814_create_duel_table.js
exports.up = function (knex) {
  return knex.schema.createTable("duels", function (table) {
    table.increments("id").primary();
    table.bigInteger("player1_id").notNullable();
    table.bigInteger("player2_id");
    table.string("status").defaultTo("waiting"); // waiting, playing, finished
    table.bigInteger("winner_id");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("duels");
};
