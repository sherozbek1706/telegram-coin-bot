// create_subscriptions_table.js

exports.up = function (knex) {
  return knex.schema.createTable("subscriptions", function (table) {
    table.increments("id").primary();
    table.bigInteger("subscriber_id").notNullable(); // foydalanuvchi kim
    table.integer("task_id").notNullable(); // qaysi topshiriq
    table.boolean("is_verified").defaultTo(false); // admin bo‘lmasa, qo‘lda tekshiriladi
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("subscriptions");
};
