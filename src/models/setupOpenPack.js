// const fs = require("fs");
// const path = require("path");
// const OPENPACKPRICE = 250;
// const footballPlayers = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
// );

// function delay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// module.exports = function setupOpenPack(bot, db) {
//   bot.hears("🆕 Yangi futbolchi ochish", async (ctx) => {
//     // bot.command("openpack", async (ctx) => {
//     try {

//       const telegramId = ctx.from.id;

//       const user = await db("users").where({ telegram_id: telegramId }).first();
//       if (!user) return ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");

//       if (user.coins < OPENPACKPRICE) {
//         return ctx.reply(
//           `❌ Sizda paket ochish uchun yetarli tanga yo'q. (Kerak: ${OPENPACKPRICE} tanga)\n` +
//             `💰 Sizda: ${user.coins} tanga mavjud`
//         );
//       }

//       await ctx.reply("📦 Paket ochilmoqda...");
//       await db("users")
//         .where({ telegram_id: telegramId })
//         .decrement("coins", OPENPACKPRICE);

//       const player = getRandomPlayer(footballPlayers);

//       // 🔹 user_players jadvaliga qo‘shish yoki quantity oshirish
//       const existingPlayer = await db("user_players")
//         .where({ user_id: telegramId, player_id: player.id })
//         .first();

//       if (existingPlayer) {
//         await db("user_players")
//           .where({ user_id: telegramId, player_id: player.id })
//           .increment("quantity", 1);
//       } else {
//         await db("user_players").insert({
//           user_id: telegramId,
//           player_id: player.id,
//           quantity: 1,
//         });
//       }

//       const revealSteps = [
//         { text: `📍 Pozitsiya: *${player.position}*`, delay: 500 },
//         { text: `🌍 Mamlakat: *${player.country}*`, delay: 1000 },
//         { text: `🏟 Klub: *${player.club}*`, delay: 1500 },
//         { text: `⭐ Reyting: *${player.rating}*`, delay: 2000 },
//       ];

//       for (const step of revealSteps) {
//         await delay(step.delay);
//         await ctx.reply(step.text, { parse_mode: "Markdown" });
//       }

//       await delay(800);
//       const updatedUser = await db("users")
//         .where({ telegram_id: telegramId })
//         .first();

//       const caption =
//         `🎉 *Yangi futbolchi!*\n\n` +
//         `👤 *${player.name}*\n` +
//         `⭐ *Reyting:* ${player.rating}\n` +
//         `📌 *Pozitsiya:* ${player.position}\n` +
//         `🌍 *Mamlakat:* ${player.country}\n` +
//         `🏟 *Klub:* ${player.club}\n` +
//         // `💰 *Qiymat:* ${player.value} tanga\n` +
//         `🏅 *Status:* ${player.status}\n\n` +
//         `💳 Sizda: ${updatedUser.coins} tanga qoldi\n`;

//       const buttons = {
//         parse_mode: "Markdown",
//       };

//       if (player.image && player.image.trim() !== "") {
//         await ctx.replyWithPhoto(
//           { url: player.image },
//           { caption, ...buttons }
//         );
//       } else {
//         await ctx.reply(caption, buttons);
//       }
//     } catch (error) {
//       console.error("Error in openpack command:", error);
//       ctx.reply(
//         "❌ Paket ochish jarayonida xatolik yuz berdi. Iltimos, keyinroq qayta urunib ko'ring."
//       );
//     }
//   });
// };

// function getRandomPlayer(players) {
//   if (!Array.isArray(players)) {
//     throw new Error("Players must be an array");
//   }
//   if (players.length === 0) {
//     throw new Error("Players array cannot be empty");
//   }

//   let totalWeight = 0;
//   const weightedPlayers = players.map((player) => {
//     const dropRate =
//       typeof player.dropRate === "number" &&
//       player.dropRate >= 0 &&
//       player.dropRate <= 1
//         ? player.dropRate
//         : 0.1;

//     const weight = Math.max(1, Math.floor(dropRate * 1000));
//     totalWeight += weight;

//     return {
//       player,
//       cumulativeWeight: totalWeight,
//       weight,
//     };
//   });

//   const randomValue = Math.random() * totalWeight;

//   for (const weightedPlayer of weightedPlayers) {
//     if (randomValue < weightedPlayer.cumulativeWeight) {
//       return weightedPlayer.player;
//     }
//   }
//   return players[0];
// }

/**
 *
 * TEPADAGI SETTIMEOUT BILAN ISHLAYDI
 *
 * PASTDAGI ESA HECH QANDAY SET TIMEOUT YO'Q
 *
 */

const fs = require("fs");
const path = require("path");
const OPENPACKPRICE = 250;
const footballPlayers = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
);

module.exports = function setupOpenPack(bot, db) {
  bot.hears("🆕 Yangi futbolchi ochish", async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const user = await db("users").where({ telegram_id: telegramId }).first();
      if (!user) return ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");

      if (user.coins < OPENPACKPRICE) {
        return ctx.reply(
          `❌ Paket ochish uchun ${OPENPACKPRICE} tanga kerak.\n💰 Sizda: ${user.coins} tanga`
        );
      }

      // Tangani yechib olish
      await db("users")
        .where({ telegram_id: telegramId })
        .decrement("coins", OPENPACKPRICE);

      // Tasodifiy player tanlash
      const player = getRandomPlayer(footballPlayers);

      // Userga qo'shish
      const existingPlayer = await db("user_players")
        .where({ user_id: telegramId, player_id: player.id })
        .first();

      if (existingPlayer) {
        await db("user_players")
          .where({ user_id: telegramId, player_id: player.id })
          .increment("quantity", 1);
      } else {
        await db("user_players").insert({
          user_id: telegramId,
          player_id: player.id,
          quantity: 1,
        });
      }

      const updatedUser = await db("users")
        .where({ telegram_id: telegramId })
        .first();

      const caption =
        `🎉 *Yangi futbolchi!*\n\n` +
        `👤 *${player.name}*\n` +
        `⭐ *Reyting:* ${player.rating}\n` +
        `📌 *Pozitsiya:* ${player.position}\n` +
        `🌍 *Mamlakat:* ${player.country}\n` +
        `🏟 *Klub:* ${player.club}\n` +
        `🏅 *Status:* ${player.status}\n\n` +
        `💳 Sizda: ${updatedUser.coins} tanga qoldi\n`;

      if (player.image && player.image.trim() !== "") {
        await ctx.replyWithPhoto(
          { url: player.image },
          { caption, parse_mode: "Markdown" }
        );
      } else {
        await ctx.reply(caption, { parse_mode: "Markdown" });
      }
    } catch (error) {
      console.error("Error in openpack command:", error);
      ctx.reply("❌ Paket ochishda xatolik yuz berdi.");
    }
  });
};

function getRandomPlayer(players) {
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error("Players must be a non-empty array");
  }

  let totalWeight = 0;
  const weightedPlayers = players.map((player) => {
    const dropRate =
      typeof player.dropRate === "number" &&
      player.dropRate >= 0 &&
      player.dropRate <= 1
        ? player.dropRate
        : 0.1;

    const weight = Math.max(1, Math.floor(dropRate * 1000));
    totalWeight += weight;

    return {
      player,
      cumulativeWeight: totalWeight,
    };
  });

  const randomValue = Math.random() * totalWeight;
  return weightedPlayers.find((wp) => randomValue < wp.cumulativeWeight).player;
}
