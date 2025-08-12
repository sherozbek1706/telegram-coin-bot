// const getUserPlayersStatistics = require("../functions/getUserPlayersStatistics");
// const statisticsUserPlayers = require("../models/statisticsUserPlayers");

// const CONDITIONS = [
//   {
//     level: 1,
//     workers: 20,
//     players: {
//       legendary: 0,
//       medium: 10,
//       basic: 20,
//     },
//   },
//   {
//     level: 2,
//     workers: 30,
//     players: {
//       legendary: 0,
//       medium: 17,
//       basic: 32,
//     },
//   },
// ];

// function checkLevelAndOpenPack(bot, db) {
//   return async (ctx, next) => {
//     try {
//       const user_id = ctx.from.id;
//       const user = await db("users").where({ telegram_id: user_id }).first();
//       if (!user) {
//         return ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");
//       }

//       const usersWorkers = await db("user_workers")
//         .where({ user_id })
//         .sum("quantity as totalWorkers")
//         .first();

//       let statistics = await getUserPlayersStatistics({
//         telegram_id: user_id,
//         db,
//       });

//       console.log(statistics);

//       await next();
//     } catch (error) {
//       confirm.error("checkLevelandOpenPack middleware error:", error);
//     }
//   };
// }

// module.exports = { checkLevelAndOpenPack };

/**
 *
 *
 *
 */
// const getUserPlayersStatistics = require("../functions/getUserPlayersStatistics");

// const CONDITIONS = [
//   {
//     level: 1,
//     workers: 20,
//     players: {
//       legendary: 0,
//       medium: 10,
//       basic: 20,
//     },
//   },
//   {
//     level: 2,
//     workers: 30,
//     players: {
//       legendary: 0,
//       medium: 17,
//       basic: 32,
//     },
//   },
// ];

// function checkLevelAndOpenPack(bot, db) {
//   return async (ctx, next) => {
//     try {
//       const user_id = ctx.from.id;
//       const user = await db("users").where({ telegram_id: user_id }).first();
//       if (!user) {
//         return ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");
//       }

//       // Ishchilar soni
//       const usersWorkers = await db("user_workers")
//         .where({ user_id })
//         .sum("quantity as totalWorkers")
//         .first();
//       const workersCount = Number(usersWorkers.totalWorkers || 0);

//       // Foydalanuvchi futbolchilar statistikasi
//       const statistics = await getUserPlayersStatistics({
//         telegram_id: user_id,
//         db,
//       });

//       const byStatus = statistics.statistics.byStatus;

//       // Levelni aniqlash
//       let matchedLevel = null;
//       let unmetConditions = null;

//       for (let condition of CONDITIONS) {
//         if (workersCount >= condition.workers) {
//           const meetsPlayers =
//             byStatus.legendary.quantity >= condition.players.legendary &&
//             byStatus.medium.quantity >= condition.players.medium &&
//             byStatus.basic.quantity >= condition.players.basic;

//           if (meetsPlayers) {
//             matchedLevel = condition.level;
//           } else {
//             unmetConditions = {
//               legendary:
//                 condition.players.legendary - byStatus.legendary.quantity,
//               medium: condition.players.medium - byStatus.medium.quantity,
//               basic: condition.players.basic - byStatus.basic.quantity,
//               requiredWorkers: condition.workers - workersCount,
//             };
//           }
//         } else {
//           unmetConditions = {
//             legendary:
//               condition.players.legendary - byStatus.legendary.quantity,
//             medium: condition.players.medium - byStatus.medium.quantity,
//             basic: condition.players.basic - byStatus.basic.quantity,
//             requiredWorkers: condition.workers - workersCount,
//           };
//         }
//       }

//       if (!matchedLevel) {
//         let message = `⚠️ Siz keyingi ishchilar bo‘limiga o‘tish uchun shartlarni bajarmadingiz:\n\n`;

//         if (unmetConditions.requiredWorkers > 0) {
//           message += `👷‍♂️ Ishchilar yetarli emas: ${workersCount} / ${CONDITIONS[1].workers}\n`;
//         }

//         message += `🏆 Afsonaviy futbolchilar: ${byStatus.legendary.quantity} / ${CONDITIONS[1].players.legendary}\n`;
//         message += `⭐ O'rtacha futbolchilar: ${byStatus.medium.quantity} / ${CONDITIONS[1].players.medium}\n`;
//         message += `🔹 Oddiy futbolchilar: ${byStatus.basic.quantity} / ${CONDITIONS[1].players.basic}\n`;

//         return ctx.reply(message, { parse_mode: "HTML" });
//       }

//       ctx.state.userLevel = matchedLevel;
//       await next();
//     } catch (error) {
//       console.error("checkLevelAndOpenPack middleware error:", error);
//       ctx.reply("❌ Xatolik yuz berdi.");
//     }
//   };
// }

// module.exports = { checkLevelAndOpenPack };

/**
 *
 *
 *
 */

// const getUserPlayersStatistics = require("../functions/getUserPlayersStatistics");

// const LEVEL_TASKS = [
//   {
//     workersRange: [20, 29], // 20-29 ishchi oralig'idagi foydalanuvchilar
//     requiredPlayers: {
//       legendary: 0,
//       medium: 10,
//       basic: 20,
//     },
//     taskDescription: "10 ta ⭐ O'rtacha va 20 ta 🔹 Oddiy futbolchi yig'ish",
//   },
//   {
//     workersRange: [30, 39], // 30-39 ishchi oralig'idagi foydalanuvchilar
//     requiredPlayers: {
//       legendary: 0,
//       medium: 17,
//       basic: 32,
//     },
//     taskDescription: "17 ta ⭐ O'rtacha va 32 ta 🔹 Oddiy futbolchi yig'ish",
//   },
//   // Qo'shimcha darajalar uchun shartlarni qo'shishingiz mumkin
// ];

// function checkLevelAndOpenPack(bot, db) {
//   return async (ctx, next) => {
//     try {
//       const user_id = ctx.from.id;

//       // Foydalanuvchining ishchilar sonini olish
//       const workersResult = await db("user_workers")
//         .where({ user_id })
//         .sum("quantity as totalWorkers")
//         .first();

//       const workersCount = Number(workersResult.totalWorkers || 0);

//       // Foydalanuvchi futbolchilar statistikasini olish
//       const stats = await getUserPlayersStatistics({
//         telegram_id: user_id,
//         db,
//       });
//       const playerStats = stats.statistics.byStatus;

//       // Foydalanuvchi uchun mos vazifani topish
//       let currentTask = null;
//       let nextTask = null;

//       for (const task of LEVEL_TASKS) {
//         if (
//           workersCount >= task.workersRange[0] &&
//           workersCount <= task.workersRange[1]
//         ) {
//           currentTask = task;
//           break;
//         }
//       }

//       // Agar foydalanuvchi hech qanday vazifaga mos kelmasa
//       if (!currentTask) {
//         if (workersCount < LEVEL_TASKS[0].workersRange[0]) {
//           return ctx.replyWithHTML(
//             `👷‍♂️ <b>Sizda ${workersCount} ta ishchi bor.</b>\n` +
//               `Ishchilar bo'limida vazifa olish uchun kamida ${LEVEL_TASKS[0].workersRange[0]} ta ishchi kerak.`
//           );
//         } else {
//           return ctx.replyWithHTML(
//             `🎉 Tabriklaymiz! Siz barcha vazifalarni bajardingiz.\n` +
//               `Hozirda sizda ${workersCount} ta ishchi bor.`
//           );
//         }
//       }

//       // Vazifa bajarilganligini tekshirish
//       const isTaskCompleted =
//         playerStats.legendary.quantity >=
//           currentTask.requiredPlayers.legendary &&
//         playerStats.medium.quantity >= currentTask.requiredPlayers.medium &&
//         playerStats.basic.quantity >= currentTask.requiredPlayers.basic;

//       // Vazifa holati haqida xabar
//       let message = `👷‍♂️ <b>Sizda ${workersCount} ta ishchi bor</b>\n\n`;

//       if (!isTaskCompleted) {
//         message += `📋 <b>Joriy vazifa:</b> ${currentTask.taskDescription}\n\n`;
//         message += `📊 Progress:\n`;
//         message += `⭐ O'rtacha: ${playerStats.medium.quantity}/${currentTask.requiredPlayers.medium}\n`;
//         message += `🔹 Oddiy: ${playerStats.basic.quantity}/${currentTask.requiredPlayers.basic}\n`;
//       } else {
//         message += `✅ <b>Siz joriy vazifani bajardingiz:</b> ${currentTask.taskDescription}\n\n`;

//         // Keyingi vazifani ko'rsatish
//         const nextTaskIndex = LEVEL_TASKS.findIndex(
//           (t) => t.workersRange[0] > currentTask.workersRange[1]
//         );

//         if (nextTaskIndex !== -1) {
//           nextTask = LEVEL_TASKS[nextTaskIndex];
//           message += `🔜 <b>Keyingi vazifa (${nextTask.workersRange[0]}+ ishchi):</b>\n`;
//           message += `${nextTask.taskDescription}`;
//         } else {
//           message += `🎉 Siz barcha vazifalarni bajardingiz!`;
//         }
//       }

//       await ctx.replyWithHTML(message);

//       // Agar vazifa bajarilgan bo'lsa va keyingi middlewarega o'tish kerak bo'lsa
//       if (isTaskCompleted) {
//         return next();
//       }
//     } catch (error) {
//       console.error("checkLevelAndOpenPack middleware error:", error);
//       ctx.reply(
//         "❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
//       );
//     }
//   };
// }

// module.exports = { checkLevelAndOpenPack };

/**
 *
 *
 *
 */

// const getUserPlayersStatistics = require("../functions/getUserPlayersStatistics");

// const LEVEL_TASKS = [
//   {
//     workersRange: [20, 29],
//     requiredPlayers: { legendary: 0, medium: 10, basic: 20 },
//     taskDescription: "10 ta ⭐ O'rtacha va 20 ta 🔹 Oddiy futbolchi yig'ish",
//   },
//   {
//     workersRange: [30, 39],
//     requiredPlayers: { legendary: 0, medium: 17, basic: 32 },
//     taskDescription: "17 ta ⭐ O'rtacha va 32 ta 🔹 Oddiy futbolchi yig'ish",
//   },
//   // kerak bo'lsa qo'shimcha darajalar
// ];

// function checkLevelAndOpenPack(bot, db) {
//   return async (ctx, next) => {
//     try {
//       const user_id = ctx.from.id;

//       // Ishchilar soni
//       const workersResult = await db("user_workers")
//         .where({ user_id })
//         .sum("quantity as totalWorkers")
//         .first();
//       const workersCount = Number(workersResult.totalWorkers || 0);

//       // Foydalanuvchi futbolchilar statistikasi
//       const stats = await getUserPlayersStatistics({
//         telegram_id: user_id,
//         db,
//       });
//       const playerStats = stats.statistics.byStatus;

//       // Ishchi soniga mos vazifa
//       let currentTask = LEVEL_TASKS.find(
//         (task) =>
//           workersCount >= task.workersRange[0] &&
//           workersCount <= task.workersRange[1]
//       );

//       // Agar hech qaysi taskga tushmasa — hech nima demay o'tkazamiz
//       if (!currentTask) {
//         return next();
//       }

//       // Vazifa shartlarini tekshirish
//       const enoughPlayers =
//         playerStats.legendary.quantity >=
//           currentTask.requiredPlayers.legendary &&
//         playerStats.medium.quantity >= currentTask.requiredPlayers.medium &&
//         playerStats.basic.quantity >= currentTask.requiredPlayers.basic;

//       if (!enoughPlayers) {
//         return ctx.replyWithHTML(
//           `⚠️ <b>Ishchilar bo'limiga kirish uchun quyidagilar kerak:</b>\n` +
//             `⭐ O'rtacha: ${playerStats.medium.quantity}/${currentTask.requiredPlayers.medium}\n` +
//             `🔹 Oddiy: ${playerStats.basic.quantity}/${currentTask.requiredPlayers.basic}\n\n` +
//             `📋 Vazifa: ${currentTask.taskDescription}`
//         );
//       }

//       // Agar hammasi joyida bo‘lsa — keyingi bosqichga o‘tamiz
//       return next();
//     } catch (error) {
//       console.error("checkLevelAndOpenPack middleware error:", error);
//       ctx.reply("❌ Xatolik yuz berdi. Keyinroq urinib ko‘ring.");
//     }
//   };
// }

// module.exports = { checkLevelAndOpenPack };

/**
 *
 *
 *
 */

const getUserPlayersStatistics = require("../functions/getUserPlayersStatistics");

// Vazifalar konfiguratsiyasi
const LEVEL_TASKS = [
  {
    workersRange: [20, 29], // 20-29 ishchi oralig'i
    requiredPlayers: {
      legendary: 0,
      medium: 10,
      basic: 20,
    },
    taskDescription: "10 ta ⭐ O'rtacha va 20 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏗️ Ishchilar bo'limi (20-29 ishchi)",
  },
  {
    workersRange: [30, 39], // 30-39 ishchi oralig'i
    requiredPlayers: {
      legendary: 2,
      medium: 17,
      basic: 32,
    },
    taskDescription:
      "2 ta 🏆 Afsonaviy, 17 ta ⭐ O'rtacha va 32 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏢 Ishchilar bo'limi (30-39 ishchi)",
  },
  // Qo'shimcha darajalar uchun shablon:
  {
    workersRange: [40, 49],
    requiredPlayers: { legendary: 5, medium: 25, basic: 50 },
    taskDescription:
      "5 ta 🏆 Afsonaviy, 25 ta ⭐ O'rtacha va 50 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏛️ Ishchilar bo'limi (40-49 ishchi)",
  },
  {
    workersRange: [50, 59],
    requiredPlayers: { legendary: 15, medium: 35, basic: 70 },
    taskDescription:
      "15 ta 🏆 Afsonaviy, 35 ta ⭐ O'rtacha va 70 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏛️ Ishchilar bo'limi (50-59 ishchi)",
  },
  {
    workersRange: [60, 69],
    requiredPlayers: { legendary: 25, medium: 50, basic: 100 },
    taskDescription:
      "25 ta 🏆 Afsonaviy, 50 ta ⭐ O'rtacha va 100 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏛️ Ishchilar bo'limi (60-69 ishchi)",
  },
  {
    workersRange: [70, 79],
    requiredPlayers: { legendary: 40, medium: 70, basic: 120 },
    taskDescription:
      "40 ta 🏆 Afsonaviy, 70 ta ⭐ O'rtacha va 120 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏛️ Ishchilar bo'limi (70-79 ishchi)",
  },
  {
    workersRange: [80, 89],
    requiredPlayers: { legendary: 60, medium: 90, basic: 180 },
    taskDescription:
      "60 ta 🏆 Afsonaviy, 90 ta ⭐ O'rtacha va 180 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏛️ Ishchilar bo'limi (80-89 ishchi)",
  },
  {
    workersRange: [90, 99],
    requiredPlayers: { legendary: 80, medium: 150, basic: 240 },
    taskDescription:
      "80 ta 🏆 Afsonaviy, 150 ta ⭐ O'rtacha va 240 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏛️ Ishchilar bo'limi (90-99 ishchi)",
  },
  {
    workersRange: [100, 199],
    requiredPlayers: { legendary: 100, medium: 300, basic: 400 },
    taskDescription:
      "100 ta 🏆 Afsonaviy, 300 ta ⭐ O'rtacha va 400 ta 🔹 Oddiy futbolchi yig'ish",
    unlockMessage: "🏛️ Ishchilar bo'limi (100-199 ishchi)",
  },
];

const VoiceId =
  "AwACAgIAAxkBAAK882idugABpHwz98kr1lapQVaaQF18qgAC7HYAAhbc8UjQ0VK8IBlKwjYE";

/**
 * Ishchilar bo'limiga kirish uchun daraja va vazifalarni tekshiradigan middleware
 */
function checkLevelAndOpenPack(bot, db) {
  return async (ctx, next) => {
    try {
      const { id: user_id } = ctx.from;

      // 1. Ishchilar sonini olish
      const { totalWorkers } = await db("user_workers")
        .where({ user_id })
        .sum("quantity as totalWorkers")
        .first();

      const workersCount = parseInt(totalWorkers) || 0;

      // 2. Foydalanuvchi statistikasini olish
      const { statistics } = await getUserPlayersStatistics({
        telegram_id: user_id,
        db,
      });
      const { legendary, medium, basic } = statistics.byStatus;

      // 3. Mos vazifani topish
      const currentTask = LEVEL_TASKS.find(
        (task) =>
          workersCount >= task.workersRange[0] &&
          workersCount <= task.workersRange[1]
      );

      // 4. Agar mos vazifa topilmasa - o'tkazib yuborish
      if (!currentTask) {
        return next();
      }

      // 5. Vazifa shartlarini tekshirish
      const hasEnoughPlayers =
        legendary.quantity >= currentTask.requiredPlayers.legendary &&
        medium.quantity >= currentTask.requiredPlayers.medium &&
        basic.quantity >= currentTask.requiredPlayers.basic;

      // 6. Agar shartlar bajarilmagan bo'lsa
      if (!hasEnoughPlayers) {
        // Ovozli xabar

        const progressMessage = [
          `🔒 <b>${currentTask.unlockMessage}</b>`,
          ``,
          `📋 <b>Vazifa:</b> ${currentTask.taskDescription}`,
          ``,
          `📊 <b>Progress:</b>`,
          `🏆 Afsonaviy: ${legendary.quantity}/${currentTask.requiredPlayers.legendary}`,
          `⭐ O'rtacha: ${medium.quantity}/${currentTask.requiredPlayers.medium}`,
          `🔹 Oddiy: ${basic.quantity}/${currentTask.requiredPlayers.basic}`,
          ``,
          `ℹ️ Sizda ${workersCount} ta ishchi bor.`,
        ].join("\n");

        await ctx.replyWithHTML(progressMessage);
        return await ctx.replyWithVoice(VoiceId);
      }

      // 7. Agar barcha shartlar bajarilgan bo'lsa - keyingi bosqichga o'tish
      return next();
    } catch (error) {
      console.error("⚠️ checkLevelAndOpenPack middleware error:", error);
      await ctx.replyWithHTML(
        "❌ Xatolik yuz berdi. Iltimos, birozdan keyin qayta urinib ko'ring."
      );
    }
  };
}

module.exports = { checkLevelAndOpenPack };
