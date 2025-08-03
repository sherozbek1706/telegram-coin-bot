exports.up = function (knex) {
  return knex.schema.createTable("users", function (table) {
    table.increments("id").primary();
    table.bigInteger("telegram_id").unique().notNullable();
    table.string("username");
    table.string("first_name");
    table.integer("coins").defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
