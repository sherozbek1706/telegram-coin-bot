// const fs = require("fs");
// const path = require("path");

// const footballPlayers = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
// );

// module.exports = (bot, db) => {
//   bot.command("all_players_stats", async (ctx) => {
//     try {
//       // Barcha foydalanuvchilarni olish
//       const users = await db("users").select(
//         "telegram_id",
//         "username",
//         "first_name"
//       );

//       if (users.length === 0) {
//         return ctx.reply("❌ Hali foydalanuvchilar yo‘q.");
//       }

//       let message = "📊 *Barcha foydalanuvchilar futbolchi statistikasi:*\n\n";

//       for (const user of users) {
//         // Foydalanuvchi futbolchilari
//         const userPlayers = await db("user_players")
//           .where({ user_id: user.telegram_id })
//           .select("player_id", "quantity");

//         let total = 0;
//         let legendary = 0;
//         let epic = 0;
//         let rare = 0;

//         userPlayers.forEach((up) => {
//           const player = footballPlayers.find((p) => p.id === up.player_id);
//           if (player) {
//             total += up.quantity;
//             if (player.status === "legendary") legendary += up.quantity;
//             else if (player.status === "epic") epic += up.quantity;
//             else if (player.status === "rare") rare += up.quantity;
//           }
//         });

//         message +=
//           `👤 ${user.first_name || ""} (@${user.username || "—"})\n` +
//           `🏆 Legend: ${legendary} | ⭐ Epic: ${epic} | 🔹 Rare: ${rare} | 📦 Jami: ${total}\n\n`;
//       }

//       ctx.replyWithMarkdown(message);
//     } catch (error) {
//       console.error("Error in /all_players_stats:", error);
//       ctx.reply("❌ Xatolik yuz berdi.");
//     }
//   });
// };
/***
 *
 *
 *
 */

// const fs = require("fs");
// const path = require("path");

// const footballPlayers = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
// );

// const PER_PAGE = 5; // Har sahifada nechta foydalanuvchi ko‘rsatish

// module.exports = (bot, db) => {
//   // Statistika chiqarish funksiyasi
//   async function getPlayersStats(page) {
//     const users = await db("users").select(
//       "telegram_id",
//       "username",
//       "first_name"
//     );

//     let filteredUsers = [];
//     for (const user of users) {
//       const userPlayers = await db("user_players")
//         .where({ user_id: user.telegram_id })
//         .select("player_id", "quantity");

//       if (userPlayers.length === 0) continue; // Futbolchisi yo‘q bo‘lsa o‘tkazib yuboramiz

//       let total = 0,
//         legendary = 0,
//         epic = 0,
//         rare = 0;

//       userPlayers.forEach((up) => {
//         const player = footballPlayers.find((p) => p.id === up.player_id);
//         if (player) {
//           total += up.quantity;
//           if (player.status === "Afsonaviy") legendary += up.quantity;
//           else if (player.status === "O'rtacha") epic += up.quantity;
//           else if (player.status === "Oddiy") rare += up.quantity;
//         }
//       });

//       filteredUsers.push({
//         name: user.first_name || "",
//         username: user.username || "—",
//         legendary,
//         epic,
//         rare,
//         total,
//       });
//     }

//     // Sahifalash
//     const startIndex = page * PER_PAGE;
//     const endIndex = startIndex + PER_PAGE;
//     const paginated = filteredUsers.slice(startIndex, endIndex);

//     let message = "📊 *Futbolchi statistikasi:*\n\n";
//     paginated.forEach((u) => {
//       message +=
//         `👤 ${u.name} (@${u.username})\n` +
//         `🏆 Afsonaviy: ${u.legendary} | ⭐ O'rtacha: ${u.epic} | 🔹 Oddiy: ${u.rare} | 📦 Jami: ${u.total}\n\n`;
//     });

//     const totalPages = Math.ceil(filteredUsers.length / PER_PAGE);
//     return { message, totalPages };
//   }

//   // Komanda
//   bot.command("all_players_stats", async (ctx) => {
//     const page = 0;
//     const { message, totalPages } = await getPlayersStats(page);

//     const buttons = [];
//     if (totalPages > 1) {
//       buttons.push([
//         { text: "➡️ Keyingi", callback_data: `stats_${page + 1}` },
//       ]);
//     }

//     await ctx.replyWithMarkdown(message, {
//       reply_markup: { inline_keyboard: buttons },
//     });
//   });

//   // Callback
//   bot.on("callback_query", async (ctx) => {
//     const data = ctx.callbackQuery.data;

//     if (data.startsWith("stats_")) {
//       const page = parseInt(data.split("_")[1]);
//       const { message, totalPages } = await getPlayersStats(page);

//       const buttons = [];
//       const navRow = [];

//       if (page > 0) {
//         navRow.push({ text: "⬅️ Oldingi", callback_data: `stats_${page - 1}` });
//       }
//       if (page < totalPages - 1) {
//         navRow.push({ text: "➡️ Keyingi", callback_data: `stats_${page + 1}` });
//       }
//       if (navRow.length) buttons.push(navRow);

//       await ctx.editMessageText(message, {
//         parse_mode: "Markdown",
//         reply_markup: { inline_keyboard: buttons },
//       });
//     }
//   });
// };

const fs = require("fs");
const path = require("path");

const footballPlayers = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
);

const PER_PAGE = 5; // Number of users to show per page

module.exports = (bot, db) => {
  // Statistics function
  async function getPlayersStats(page) {
    const users = await db("users").select(
      "telegram_id",
      "username",
      "first_name"
    );

    let filteredUsers = [];
    for (const user of users) {
      const userPlayers = await db("user_players")
        .where({ user_id: user.telegram_id })
        .select("player_id", "user_id", "quantity");

      if (userPlayers.length === 0) continue; // Skip if user has no players

      let total = 0,
        legendary = 0,
        epic = 0,
        rare = 0;

      userPlayers.forEach((up) => {
        const player = footballPlayers.find((p) => p.id === up.player_id);
        if (player) {
          total += up.quantity;
          if (player.status === "Afsonaviy") legendary += up.quantity;
          else if (player.status === "O'rtacha") epic += up.quantity;
          else if (player.status === "Oddiy") rare += up.quantity;
        }
      });

      filteredUsers.push({
        name: user.first_name || "",
        username: user.username || "—",
        user_id: user.telegram_id || "—",
        legendary,
        epic,
        rare,
        total,
      });
    }

    // Sort by total players (descending)
    filteredUsers.sort((a, b) => b.total - a.total);

    // Pagination
    const startIndex = page * PER_PAGE;
    const endIndex = startIndex + PER_PAGE;
    const paginated = filteredUsers.slice(startIndex, endIndex);

    let message = "<b>📊 Futbolchi statistikasi:</b>\n\n";
    paginated.forEach((u, index) => {
      message +=
        ` <b>${startIndex + index + 1}. 👤 ${u.name}</b> (@${u.username}) 🆔 ${
          u.user_id
        }\n` +
        `<b>🏆 Afsonaviy:</b> ${u.legendary} | <b>⭐ O'rtacha:</b> ${u.epic} | <b>🔹 Oddiy:</b> ${u.rare} | <b>📦 Jami:</b> ${u.total}\n\n`;
    });

    // Add page info
    const totalPages = Math.ceil(filteredUsers.length / PER_PAGE);
    message += `\n<b>Sahifa:</b> ${page + 1}/${totalPages}`;

    return { message, totalPages };
  }

  // Command
  bot.command("all_players_stats", async (ctx) => {
    const page = 0;
    const { message, totalPages } = await getPlayersStats(page);

    const buttons = [];
    if (totalPages > 1) {
      buttons.push([
        { text: "➡️ Keyingi", callback_data: `stats_${page + 1}` },
      ]);
    }

    await ctx.reply(message, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  });

  // Callback handler
  bot.on("callback_query", async (ctx, next) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith("stats_")) {
      const page = parseInt(data.split("_")[1]);
      const { message, totalPages } = await getPlayersStats(page);

      const buttons = [];
      const navRow = [];

      if (page > 0) {
        navRow.push({ text: "⬅️ Oldingi", callback_data: `stats_${page - 1}` });
      }
      if (page < totalPages - 1) {
        navRow.push({ text: "➡️ Keyingi", callback_data: `stats_${page + 1}` });
      }
      if (navRow.length) buttons.push(navRow);

      try {
        await ctx.editMessageText(message, {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buttons },
        });
      } catch (err) {
        console.error("Error editing message:", err);
      }
    }

    return next();
  });
};
