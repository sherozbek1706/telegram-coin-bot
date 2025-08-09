exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.bigInteger("referred_by").nullable();
    table.integer("invited_count").defaultTo(0); // nechta do‘st taklif qilgan
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("referred_by");
    table.dropColumn("invited_count");
  });
};
