exports.seed = async function (knex) {
  await knex("pirate_map").del();
  await knex("pirate_map").insert([
    { type: "treasure", description: "🏝 Xazina topdingiz", value: 30 },
    { type: "enemy", description: "⚓ Dushman kemasi hujum qildi", value: -20 },
    {
      type: "storm",
      description: "🌪 Bo‘ron yurishingizni to‘xtatdi",
      value: 0,
    },
    {
      type: "map_piece",
      description: "📜 Xazina xaritasining bo‘lagini topdingiz",
      value: 10,
    },
    {
      type: "treasure",
      description: "🏝 Katta xazinaga duch keldingiz",
      value: 50,
    },
    { type: "enemy", description: "⚔️ Qattiq jang", value: -30 },
  ]);
};
