// index.js
require("dotenv").config();

const express = require("express");
const { Telegraf } = require("telegraf");
const path = require("path");
const LocalSession = require("telegraf-session-local");
const rateLimit = require("telegraf-ratelimit");
const session = new LocalSession({
  database: path.join(__dirname, "../session_bot.json"), // <-- mana bu joy muhim
});
const knex = require("knex");
// const cron = require("node-cron");
const setupBot = require("./bot");
const dbConfig = require("../knexfile");
const blockeduser = require("./middlewares/blockeduser");
// const checkUnsubscribedUsers = require("./functions/check-unsubscripe-users");

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const RATE_LIMIT = 20;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in .env file");
  process.exit(1);
}

// cron.schedule("*/1 * * * *", () => {
//   console.log("🔍 Obuna tekshiruvi boshlandi");
//   checkUnsubscribedUsers();
// });

// Knex orqali PostgreSQL ulanish
const db = knex(dbConfig.development);

// Telegraf bot yaratish
const bot = new Telegraf(BOT_TOKEN);
const rateLimitConfig = {
  window: 60 * 1000, // 60 soniya (1 daqiqa)
  limit: RATE_LIMIT, // Har 60 soniyada 30 ta so'rov
  onLimitExceeded: (ctx, next) => {
    console.log("❗️ So'rov chegarasi oshirildi:", ctx.from.id) ||
      ctx.reply(
        `⏳ Iltimos, 1 daqiqa ichida ${RATE_LIMIT} ta so‘rovdan oshmang! Biroz kuting.`
      );
  },
};

// Middleware qo'llash
bot.use(session.middleware());
bot.use(rateLimit(rateLimitConfig));
bot.use(blockeduser());

// Bot logikasini yuklash
setupBot(bot, db);

// Botni ishga tushirish (polling)
bot
  .launch()
  .then(() => console.log("🤖 Bot polling orqali ishga tushdi"))
  .catch((err) => console.error("❌ Botni ishga tushirishda xatolik:", err));

// Express route (sog‘lomlik tekshiruvi uchun)
app.get("/", (req, res) => {
  res.send("Telegram Coin Bot ishga tushdi");
});

// app.get("/users", async (req, res) => {
//   try {
//     const users = await db("users").select(
//       "telegram_id",
//       "username",
//       "first_name",
//       "phone_number",
//       "coins",
//       "created_at"
//     );

//     if (users.length === 0) {
//       return res.status(404).json({ message: "Foydalanuvchilar topilmadi" });
//     }

//     res.json(users);
//   } catch (error) {
//     console.error("❌ Foydalanuvchilarni olishda xatolik:", error);
//     res.status(500).json({ error: "Ichki server xatosi" });
//   }
// });

app.listen(PORT, () => {
  console.log(`🚀 Express server ${PORT}-portda ishlayapti`);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// Toza to‘xtatish uchun signal catch
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
