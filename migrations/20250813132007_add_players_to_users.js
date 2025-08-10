// migrations/20250813120000_create_user_players.js
exports.up = function (knex) {
  return knex.schema.createTable("user_players", (table) => {
    table.increments("id").primary();
    table
      .bigInteger("user_id")
      .unsigned()
      .notNullable()
      .references("telegram_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("player_id").notNullable(); // football-players.json dagi id
    table.integer("quantity").defaultTo(1); // bir xil futbolchi nechta
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("user_players");
};
