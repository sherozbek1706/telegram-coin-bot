exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.timestamp("last_bonus_at");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("last_bonus_at");
  });
};
