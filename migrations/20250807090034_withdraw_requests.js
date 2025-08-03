// create_subscriptions_table.js

exports.up = function (knex) {
  return knex.schema.createTable("withdraw_requests", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("coins").notNullable();
    table.integer("amount").notNullable(); // pul miqdori so‘mda
    table.string("card_number").notNullable();
    table
      .enum("status", ["pending", "approved", "rejected"])
      .defaultTo("pending");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("withdraw_requests");
};
