exports.up = function (knex) {
  return knex.schema.createTable("pirate_games", function (table) {
    table.increments("id").primary();
    table.bigInteger("player1_id").notNullable();
    table.bigInteger("player2_id");
    table.string("status").defaultTo("waiting"); // waiting, playing, finished
    table.integer("turn").defaultTo(1);
    table.integer("round").defaultTo(0);
    table.json("positions").defaultTo(JSON.stringify({ p1: 0, p2: 0 }));
    table.json("coins").defaultTo(JSON.stringify({ p1: 100, p2: 100 }));
    table.timestamp("last_move_at").defaultTo(knex.fn.now());
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("pirate_games");
};
