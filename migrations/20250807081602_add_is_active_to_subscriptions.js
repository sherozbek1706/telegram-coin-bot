// migrations/XXXX_add_is_active_to_subscriptions.js
exports.up = function (knex) {
  return knex.schema.table("subscriptions", (table) => {
    table.boolean("is_active").defaultTo(true);
  });
};

exports.down = function (knex) {
  return knex.schema.table("subscriptions", (table) => {
    table.dropColumn("is_active");
  });
};
