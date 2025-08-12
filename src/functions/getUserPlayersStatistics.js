const fs = require("fs");
const path = require("path");

// JSON fayldan futbolchilarni yuklash
const footballPlayers = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
);

module.exports = async ({ telegram_id, db }) => {
  try {
    // Foydalanuvchining futbolchilar statistikalarini olish
    const userPlayers = await db("user_players")
      .where({ user_id: telegram_id })
      .select("player_id", "quantity");

    // Statistikani hisoblash
    const stats = {
      legendary: { count: 0, quantity: 0 },
      medium: { count: 0, quantity: 0 },
      basic: { count: 0, quantity: 0 },
      total: 0,
    };

    userPlayers.forEach((up) => {
      const player = footballPlayers.find((p) => p.id === up.player_id);
      if (player) {
        if (player.status === "Afsonaviy") {
          stats.legendary.count++;
          stats.legendary.quantity += up.quantity;
        } else if (player.status === "O'rtacha") {
          stats.medium.count++;
          stats.medium.quantity += up.quantity;
        } else {
          stats.basic.count++;
          stats.basic.quantity += up.quantity;
        }
        stats.total += up.quantity;
      }
    });

    // Natijani formatlash
    const result = {
      statistics: {
        total: stats.total,
        byStatus: {
          legendary: {
            count: stats.legendary.count,
            quantity: stats.legendary.quantity,
            label: "🏆 Afsonaviy",
          },
          medium: {
            count: stats.medium.count,
            quantity: stats.medium.quantity,
            label: "⭐ O'rtacha",
          },
          basic: {
            count: stats.basic.count,
            quantity: stats.basic.quantity,
            label: "🔹 Oddiy",
          },
        },
      },
    };

    return result;
  } catch (error) {
    console.error("Error fetching user players statistics:", error);
    throw new Error(
      "❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
    );
  }
};
