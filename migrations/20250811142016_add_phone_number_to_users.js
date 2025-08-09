// migrations/20250811_add_phone_number_to_users.js
exports.up = function (knex) {
  return knex.schema.table("users", function (table) {
    table.string("phone_number").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("users", function (table) {
    table.dropColumn("phone_number");
  });
};
