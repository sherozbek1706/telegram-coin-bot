exports.up = function (knex) {
  return knex.schema.createTable("pirate_map", function (table) {
    table.increments("id").primary();
    table.string("type").notNullable(); // treasure, enemy, storm, map_piece
    table.string("description").notNullable();
    table.integer("value").defaultTo(0); // qancha coin qo‘shiladi/ayriladi
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("pirate_map");
};
