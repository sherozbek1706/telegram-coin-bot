// index.js
require("dotenv").config();

const express = require("express");
const { Telegraf } = require("telegraf");
const path = require("path");
const LocalSession = require("telegraf-session-local");
const session = new LocalSession({
  database: path.join(__dirname, "../session_bot.json"), // <-- mana bu joy muhim
});
const knex = require("knex");
// const cron = require("node-cron");
const setupBot = require("./bot");
const dbConfig = require("../knexfile");
// const checkUnsubscribedUsers = require("./functions/check-unsubscripe-users");

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

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

bot.use(session.middleware());

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

app.listen(PORT, () => {
  console.log(`🚀 Express server ${PORT}-portda ishlayapti`);
});

// Toza to‘xtatish uchun signal catch
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
