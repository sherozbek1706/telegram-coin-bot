// const fs = require("fs");
// const path = require("path");

// // JSON fayldan futbolchilarni yuklash
// const footballPlayers = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
// );

// module.exports = function userPlayers(bot, db) {
//   bot.hears("⚽ Mening futbolchilarim", async (ctx) => {
//     try {
//       const telegramId = ctx.from.id;

//       // Foydalanuvchi borligini tekshirish
//       const user = await db("users").where({ telegram_id: telegramId }).first();
//       if (!user) return ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");

//       // Foydalanuvchining user_players ma'lumotlarini olish
//       const userPlayers = await db("user_players")
//         .where({ user_id: telegramId })
//         .select("player_id", "quantity");

//       if (!userPlayers.length) {
//         return ctx.reply("⚠️ Sizda hali futbolchilar yo'q.");
//       }

//       // Natijani tayyorlash
//       let message = `📋 Sizning futbolchilar kolleksiyangiz:\n\n`;
//       let total = 0;

//       userPlayers.forEach((up) => {
//         // JSON fayldan player ma'lumotlarini topish
//         const player = footballPlayers.find((p) => p.id === up.player_id);
//         if (player) {
//           message += `👤 ${player.name} — ${player.position}, ${player.club} — ⭐ ${player.rating} — x${up.quantity}\n`;
//           total += up.quantity;
//         }
//       });

//       message += `\n💰 Jami futbolchilar soni: ${total}`;

//       await ctx.replyWithHTML(message);
//     } catch (error) {
//       console.error("Error fetching user players:", error);
//       ctx.reply(
//         "❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
//       );
//     }
//   });
// };

const fs = require("fs");
const path = require("path");

// JSON fayldan futbolchilarni yuklash
const footballPlayers = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../football-players.json"), "utf-8")
);

module.exports = function userPlayers(bot, db) {
  const PAGE_SIZE = 10;

  bot.hears("⚽ Mening futbolchilarim", async (ctx) => {
    try {
      const telegramId = ctx.from.id;

      // Foydalanuvchi borligini tekshirish
      const user = await db("users").where({ telegram_id: telegramId }).first();
      if (!user) return ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");

      // Foydalanuvchining user_players ma'lumotlarini olish
      const userPlayers = await db("user_players")
        .where({ user_id: telegramId })
        .select("player_id", "quantity");

      if (!userPlayers.length) {
        return ctx.reply("⚠️ Sizda hali futbolchilar yo'q.");
      }

      // Birinchi sahifa
      sendPlayersPage(ctx, userPlayers, 1);
    } catch (error) {
      console.error("Error fetching user players:", error);
      ctx.reply(
        "❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
      );
    }
  });

  // Pagination callback
  bot.action(/page_(\d+)/, async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const page = parseInt(ctx.match[1]);

      const userPlayers = await db("user_players")
        .where({ user_id: telegramId })
        .select("player_id", "quantity");

      if (!userPlayers.length) {
        return ctx.reply("⚠️ Sizda hali futbolchilar yo'q.");
      }

      await sendPlayersPage(ctx, userPlayers, page, true);
    } catch (error) {
      console.error("Error handling pagination:", error);
      ctx.reply("❌ Xatolik yuz berdi.");
    }
  });

  // async function sendPlayersPage(ctx, userPlayers, page, edit = false) {
  //   const totalPages = Math.ceil(userPlayers.length / PAGE_SIZE);
  //   const currentPage = Math.min(Math.max(page, 1), totalPages);

  //   const start = (currentPage - 1) * PAGE_SIZE;
  //   const end = start + PAGE_SIZE;
  //   const pagePlayers = userPlayers.slice(start, end);

  //   let message = `<b>📋 Futbolchilar kolleksiyangiz (Sahifa ${currentPage}/${totalPages})</b>\n\n`;
  //   let total = 0;

  //   pagePlayers.forEach((up) => {
  //     const player = footballPlayers.find((p) => p.id === up.player_id);
  //     if (player) {
  //       message += `👤 <b>${player.name}</b> — <i>${player.position}, ${player.club}</i> — ⭐ <b>${player.rating}</b> — x${up.quantity}\n`;
  //       total += up.quantity;
  //     }
  //   });

  //   message += `\n💰 <b>Jami futbolchilar soni:</b> ${userPlayers.reduce(
  //     (sum, up) => sum + up.quantity,
  //     0
  //   )}`;

  //   // Inline keyboard
  //   const keyboard = [];
  //   const row = [];
  //   if (currentPage > 1)
  //     row.push({
  //       text: "⬅️ Oldingi",
  //       callback_data: `page_${currentPage - 1}`,
  //     });
  //   if (currentPage < totalPages)
  //     row.push({
  //       text: "➡️ Keyingi",
  //       callback_data: `page_${currentPage + 1}`,
  //     });
  //   if (row.length) keyboard.push(row);

  //   const opts = { parse_mode: "HTML" };
  //   if (keyboard.length) opts.reply_markup = { inline_keyboard: keyboard };

  //   if (edit && ctx.updateType === "callback_query") {
  //     await ctx.editMessageText(message, opts);
  //     await ctx.answerCbQuery(); // tugmani bosganini tasdiqlash
  //   } else {
  //     await ctx.reply(message, opts);
  //   }
  // }

  async function sendPlayersPage(ctx, userPlayers, page, edit = false) {
    // Futbolchilarni status bo'yicha guruhlash
    const groupedPlayers = {
      legendary: [],
      medium: [],
      basic: [],
    };

    userPlayers.forEach((up) => {
      const player = footballPlayers.find((p) => p.id === up.player_id);
      if (player) {
        // Har bir futbolchini statusiga qarab mos guruhga qo'shamiz
        if (player.status === "Afsonaviy") {
          groupedPlayers.legendary.push({ player, quantity: up.quantity });
        } else if (player.status === "O'rtacha") {
          groupedPlayers.medium.push({ player, quantity: up.quantity });
        } else {
          groupedPlayers.basic.push({ player, quantity: up.quantity });
        }
      }
    });

    // Barcha futbolchilarni status tartibida birlashtiramiz
    const allPlayers = [
      ...groupedPlayers.legendary,
      ...groupedPlayers.medium,
      ...groupedPlayers.basic,
    ];

    const totalPages = Math.ceil(allPlayers.length / PAGE_SIZE);
    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pagePlayers = allPlayers.slice(start, end);

    let message = `<b>📋 Futbolchilar kolleksiyangiz (Sahifa ${currentPage}/${totalPages})</b>\n\n`;

    // Statusga qarab emoji qo'shamiz
    pagePlayers.forEach(({ player, quantity }) => {
      let statusEmoji = "";
      if (player.status === "Afsonaviy") statusEmoji = "🏆 ";
      else if (player.status === "O'rtacha") statusEmoji = "⭐ ";

      message += `${statusEmoji}👤 <b>${player.name}</b> — <i>${player.position}, ${player.club}</i> — ⭐ <b>${player.rating}</b> — x${quantity}\n`;
    });

    message += `\n💰 <b>Jami futbolchilar soni:</b> ${userPlayers.reduce(
      (sum, up) => sum + up.quantity,
      0
    )}`;

    // Inline keyboard
    const keyboard = [];
    const row = [];
    if (currentPage > 1)
      row.push({
        text: "⬅️ Oldingi",
        callback_data: `page_${currentPage - 1}`,
      });
    if (currentPage < totalPages)
      row.push({
        text: "➡️ Keyingi",
        callback_data: `page_${currentPage + 1}`,
      });
    if (row.length) keyboard.push(row);

    const opts = { parse_mode: "HTML" };
    if (keyboard.length) opts.reply_markup = { inline_keyboard: keyboard };

    if (edit && ctx.updateType === "callback_query") {
      await ctx.editMessageText(message, opts);
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(message, opts);
    }
  }
};
