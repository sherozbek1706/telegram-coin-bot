exports.up = function (knex) {
  return knex.schema.createTable("tasks", function (table) {
    table.increments("id").primary();
    table.bigInteger("owner_telegram_id").notNullable(); // foydalanuvchi kim
    table.string("channel_username").notNullable(); // @kanalim
    table.integer("reward_per_subscriber").notNullable(); // necha coin beriladi
    table.integer("max_subscribers").notNullable(); // maksimal odam soni
    table.integer("current_subscribers").defaultTo(0); // hozirgi soni
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("tasks");
};
