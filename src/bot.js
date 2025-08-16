const { Markup } = require("telegraf");
const { adminOnly } = require("./middlewares/adminOnly");
const { DateTime } = require("luxon"); // vaqt bilan ishlash uchun
const ADMIN_ID = process.env.ADMIN_ID;
const xlsx = require("xlsx");
const checkPhone = require("./middlewares/checkPhone");
const { keyboard } = require("telegraf/markup");
const checktasks = require("./middlewares/checktasks");
const checkGroupMember = require("./middlewares/checkGroupMember");
const onlyPrivate = require("./middlewares/onlyPrivate");
const setupOpenPack = require("./models/setupOpenPack");
const userPlayers = require("./models/userPlayers");
const statisticsUserPlayers = require("./models/statisticsUserPlayers");
const {
  checkLevelAndOpenPack,
} = require("./middlewares/checkLevelandOpenPack");
const setupSellAllWorkers = require("./models/setupSellAllWorkers");
const allPlayerFootbalCareerStats = require("./models/allPlayerFootbalCareerStats");
const { jsPDF } = require("jspdf"); // pdf yaratish uchun
const fs = require("fs");
const path = require("path");

module.exports = function setupBot(bot, db) {
  const MAIN_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "📱 Interaktiv o'yinlar bo'limi" }],
    [{ text: "⚽ Futbolchilar bo'limi" }],
    [{ text: "👨‍🔧 Ishchilar bo‘limi" }],
    [{ text: "💰 Tanga bo‘limi" }],
    [{ text: "🎮 O‘yinlar bo‘limi" }],
    [{ text: "📋 Vazifalar bo‘limi" }],
    [{ text: "👤 Profil" }],
  ];

  const INTERACTIVE_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "🏴‍☠️ Orol o'yiniga kirish" }],
    [{ text: "⚽ Duelga kirish" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const DUEL_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "🏴‍☠️ Orol jangiga kirish" }],
    [{ text: "🎲 Zar tashlash" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const TANGA_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "🪙 Tangani ko‘rish" }],
    [{ text: "💸 Tangani pulga aylantirish" }],
    [{ text: "💸 Tanga sotib olish" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const VAZIFA_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "➕ Kanalga topshiriq qo‘shish" }],
    [{ text: "🎯 Obuna bo‘lib tanga ishlash" }],
    [{ text: "📝 Vazifalar ro'yxati" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const OYIN_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "🎮 O'yin o'ynab tanga ishlash" }],
    [{ text: "🎁 Bonus olish" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const PROFIL_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "🤝 Do‘st taklif qilish" }],
    [{ text: "🧮 Statistika" }],
    [{ text: "👤 Mening sahifam" }],
    [{ text: "🔙 Orqaga" }],
    // [{ text: "🏴‍☠️ Orol jangiga kirish" }],
    // [{ text: "🎲 Zar tashlash" }],
  ];

  const GAMES_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "🎯 Sirli kod o'yini" }],
    [{ text: "🎲 Omadli raqam o'yini" }],
    [{ text: "🎰 Slot o'yini" }],
    [{ text: "💥 Mina qidirish" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const ISHCHILAR_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "🛒 Ishchi sotib olish" }],
    [{ text: "👷‍♂️ Mening ishchilarim" }],
    [{ text: "💼 Ishchilarni sotish" }],
    [{ text: "💰 Daromadni yig‘ish" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const FUTBOLCHILAR_KEYBOARD = [
    [{ text: "MALUMOT" }],
    [{ text: "⚽ Mening futbolchilarim" }],
    [{ text: "🆕 Yangi futbolchi ochish" }],
    [{ text: "📊 Statistika" }],
    [{ text: "🔙 Orqaga" }],
  ];

  const USERS_PER_PAGE = 10;

  const REF_BONUS = 600; // taklif qilgan odamga beriladigan tanga

  const slotEmojis = ["⚽️", "🏀", "🎱", "🥎", "🎲", "🐓", "🐏"];

  const COIN_TO_CASH_RATE = 0.1;

  const QOLDIQ_BULINSIN = 10;

  const SECRETGAMEATTEMPS = 6;

  const OPENPACKPRICE = 250;

  // Mukofot konfiguratsiyasi (index = to‘g‘ri topilgan raqamlar soni)
  const REWARDS_SECRET_CODE_GAME = [0, 5, 15, 40, 100];
  // 0 ta to‘g‘ri => 0 tanga, 1 ta to‘g‘ri => 5 tanga, va hokazo

  const DUELGAMEPRICE = 10; // Duel o‘yinining narxi

  const MAX_DUELS_PER_DAY = 10; // 1 kunda bir foydalanuvchi bilan maksimal duel soni
  const INITIAL_REWARD = 100; // boshlang'ich tanga mukofoti
  const DECAY_AMOUNT = 10; // har safar o'ynaganda mukofot kamayishi

  const VoiceTopshiriqID =
    "AwACAgIAAxkBAAJBxGia7W1QH8SLEMr07ZmloP_rKrrsAALadAACqtTYSK_frWn29sxzNgQ";
  const VoiceIshchilarID =
    "AwACAgIAAxkBAAJES2ibCJmM_qTknmtbmzSOTkp_hBajAALZdgACqtTYSDukfCxZ8NBqNgQ";
  const FutbolchilarBulimiID =
    "AwACAgIAAxkBAAKm4micnpPJYX6L-xTmBnXDFlogu1CKAAJfeQACFtzpSL0UEVVemeF9NgQ";
  const InteractivVoiceId =
    "AwACAgIAAxkBAAEBBIdonuBmXCXQXi_7mPwrgPNxp2MvSQACdXgAApru-Ujx_BvRgsA7tTYE";
  const DuelVoiceID =
    "AwACAgIAAxkBAAEBBK9onuD2pgxXkeVEOqiLnKzXvIBtLQACfngAApru-UhqM1RBIhI6eTYE";

  async function sendUsersPage(ctx) {
    const page = ctx.session.userPage || 0;

    const users = await db("users")
      .select(
        "id",
        "telegram_id",
        "username",
        "first_name",
        "coins",
        "phone_number",
        "created_at"
      )
      .orderBy("created_at", "desc")
      .offset(page * USERS_PER_PAGE)
      .limit(USERS_PER_PAGE);

    const totalUsers = await db("users").count("id").first();
    const totalCount = parseInt(totalUsers.count || totalUsers["count"]);

    if (users.length === 0) {
      return ctx.reply("👥 Foydalanuvchilar topilmadi.");
    }

    let message = `👥 Foydalanuvchilar (sahifa ${page + 1}):\n\n`;

    users.forEach((user, index) => {
      message += `${page * USERS_PER_PAGE + index + 1}. 🆔 ${
        user.telegram_id
      }\n`;
      message += user.username
        ? `👤 @${user.username || "yo'q"}\n`
        : `👤 ${user.first_name || "yo'q"}\n`;
      message += `📱 +${user.phone_number || "-"}\n`;
      message += `💰 Tanga: ${user.coins}\n`;
      message += `📅 ${new Date(user.created_at).toLocaleString()}\n\n`;
    });

    const hasPrev = page > 0;
    const hasNext = (page + 1) * USERS_PER_PAGE < totalCount;

    const buttons = [];

    if (hasPrev)
      buttons.push({ text: "⬅️ Oldingi", callback_data: "prev_users" });
    if (hasNext)
      buttons.push({ text: "➡️ Keyingi", callback_data: "next_users" });

    return ctx.reply(message.slice(0, 4000), {
      reply_markup: {
        inline_keyboard: [buttons],
      },
    });
  }

  async function showTasksPage(ctx, page) {
    const perPage = 10;
    const offset = page * perPage;

    const tasks = await db("tasks")
      .orderBy("id", "desc")
      .limit(perPage)
      .offset(offset);

    const total = await db("tasks").count("* as c").first();

    if (!tasks.length) {
      return ctx.reply("📭 Hozircha tasklar yo‘q.");
    }

    const messages = await Promise.all(
      tasks.map(async (task, index) => {
        const owner = await db("users")
          .where({ telegram_id: task.owner_telegram_id })
          .first();

        return `🆔 <b>ID:</b> ${task.id}
📡 <b>Kanal:</b> ${task.channel_username}
👤 <b>Egasi:</b> ${owner?.username ? "@" + owner.username : owner?.telegram_id}
💰 <b>Tanga:</b> ${task.reward_per_subscriber}
📈 <b>Obunachilar:</b> ${task.current_subscribers} / ${task.max_subscribers}`;
      })
    );

    const messageText =
      `<b>📋 Tasklar ro'yxati (sahifa ${page + 1})</b>\n\n` +
      messages.join("\n\n");

    const buttons = [];
    if (page > 0) {
      buttons.push({ text: "◀️ Oldingisi", callback_data: "prev_tasks" });
    }
    if ((page + 1) * perPage < total.c) {
      buttons.push({ text: "🔁 Keyingisi", callback_data: "next_tasks" });
    }

    await ctx.reply(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          buttons,
          [{ text: "🔙 Orqaga", callback_data: "admin_menu" }],
        ],
      },
    });
  }

  // Foydalanuvchini olish
  async function getUser(userId) {
    let user = await db("users").where({ telegram_id: userId }).first();
    if (!user) {
      user = { telegram_id: userId, coins: 0 };
      await db("users").insert(user);
    }
    return user;
  }

  // Tanga o‘zgartirish
  async function updateUserCoins(userId, change) {
    const user = await getUser(userId);
    const newCoins = Math.max(0, user.coins + change);
    await db("users")
      .where({ telegram_id: userId })
      .update({ coins: newCoins });
  }

  async function omadliRaqamUyini(ctx) {
    console.log("Omadli raqam o'yini boshlanmoqda...");
    const userId = ctx.from.id;
    const user = await getUser(userId); // Ma'lumotlar bazasidan tanga olish funksiyasi

    if (user.coins < 5) {
      return ctx.reply("❌ Sizda o'yin uchun yetarli tanga yo'q (kerak: 5).");
    }

    // 5 tanga olib tashlaymiz
    await updateUserCoins(userId, -5);

    // Bot random son o'ylaydi va sessionda saqlaydi
    const botNumber = Math.floor(Math.random() * 10) + 1;
    ctx.session.botNumber = botNumber;
    ctx.session.step = "guessing_lucky_number";

    return ctx.reply(
      "🤔 Men 1 dan 10 gacha son o'yladim. Topishga harakat qiling:",
      {
        reply_markup: {
          keyboard: [
            [{ text: 1 }, { text: 2 }, { text: 3 }, { text: 4 }],
            [{ text: 5 }, { text: 6 }, { text: 7 }],
            [{ text: 8 }, { text: 9 }, { text: 10 }],
            [{ text: "🔙 Orqaga" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  }

  async function sendNewUsersPage(ctx) {
    const page = ctx.session.newUserPage || 0;

    // Hozirgi kunning boshlanishi
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Ertangi kunning boshlanishi
    const startOfTomorrow = new Date(startOfDay);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const users = await db("users")
      .select(
        "id",
        "telegram_id",
        "username",
        "first_name",
        "phone_number",
        "coins",
        "created_at"
      )
      .whereBetween("created_at", [startOfDay, startOfTomorrow])
      .orderBy("created_at", "desc")
      .offset(page * USERS_PER_PAGE)
      .limit(USERS_PER_PAGE);

    const totalUsers = await db("users")
      .whereBetween("created_at", [startOfDay, startOfTomorrow])
      .count("id")
      .first();
    const totalCount = parseInt(totalUsers.count || totalUsers["count"]);

    if (users.length === 0) {
      return ctx.reply("👥 Bugun foydalanuvchilar qo‘shilmadi.");
    }

    let message = `👥 Bugun qo‘shilgan foydalanuvchilar (sahifa ${
      page + 1
    }):\n\n`;

    users.forEach((user, index) => {
      message += `${page * USERS_PER_PAGE + index + 1}. 🆔 ${
        user.telegram_id
      }\n`;
      message += user.username
        ? `👤 @${user.username || "yo'q"}\n`
        : `👤 ${user.first_name || "yo'q"}\n`;
      message += `📱 +${user.phone_number || "-"}\n`;
      message += `💰 Tanga: ${user.coins}\n`;
      message += `📅 ${new Date(user.created_at).toLocaleString()}\n\n`;
    });

    const hasPrev = page > 0;
    const hasNext = (page + 1) * USERS_PER_PAGE < totalCount;

    const buttons = [];
    if (hasPrev)
      buttons.push({ text: "⬅️ Oldingi", callback_data: "prev_newusers" });
    if (hasNext)
      buttons.push({ text: "➡️ Keyingi", callback_data: "next_newusers" });

    return ctx.reply(message.slice(0, 4000), {
      reply_markup: {
        inline_keyboard: [buttons],
      },
    });
  }

  // Inline tugma keyboard (1–6)
  function getMinesKeyboard() {
    return Markup.inlineKeyboard([
      [1, 2, 3].map((n) => Markup.button.callback(`${n}`, `mines_${n}`)),
      [4, 5, 6].map((n) => Markup.button.callback(`${n}`, `mines_${n}`)),
    ]);
  }

  let getUserDetail = (user) => {
    if (user.username) {
      return `👤 @${user.username}`;
    } else if (user.first_name) {
      return `👤 ${user.first_name}`;
    } else {
      return `👤 ${user.telegram_id}`;
    }
  };

  async function canPlayDuel(player1, player2) {
    // Har ikki IDni tartiblab saqlash (shunda kim p1/p2 farq qilmaydi)
    const [idA, idB] = [Math.min(player1, player2), Math.max(player1, player2)];

    const record = await db("duel_history")
      .where({ player1_id: idA, player2_id: idB })
      .first();

    if (!record) {
      // Yangi juftlik – ruxsat
      await db("duel_history").insert({
        player1_id: idA,
        player2_id: idB,
        duel_count: 0,
      });
      return { canPlay: true, count: 0 };
    }

    // Agar 1 kundan oshgan bo'lsa, count reset qilinadi
    const diffHours =
      (new Date() - new Date(record.first_played_at)) / (1000 * 60 * 60);

    if (diffHours >= 24) {
      await db("duel_history")
        .where({ player1_id: idA, player2_id: idB })
        .update({
          duel_count: 0,
          first_played_at: db.fn.now(),
        });
      return { canPlay: true, count: 0 };
    }

    // Limit tekshirish
    if (record.duel_count >= MAX_DUELS_PER_DAY) {
      return { canPlay: false, count: record.duel_count };
    }

    return { canPlay: true, count: record.duel_count };
  }

  async function updateDuelHistory(player1, player2) {
    const [idA, idB] = [Math.min(player1, player2), Math.max(player1, player2)];
    await db("duel_history")
      .where({ player1_id: idA, player2_id: idB })
      .increment("duel_count", 1)
      .update({ last_played_at: db.fn.now() });
  }

  function calculateReward(count) {
    // count – oldingi o‘yinlar soni
    const reward = INITIAL_REWARD - count * DECAY_AMOUNT;
    return reward > 0 ? reward : 1; // minimal 1 tanga
  }

  async function startDuel(ctx, player1, player2, reward, duelId) {
    const p1 = await db("users").where({ telegram_id: player1 }).first();
    const p2 = await db("users").where({ telegram_id: player2 }).first();

    if (!p1 || !p2) return;

    const p1Strength = Math.floor(Math.random() * 50) + 50;
    const p2Strength = Math.floor(Math.random() * 50) + 50;

    let winner, loser, reason;
    if (p1Strength > p2Strength) {
      winner = p1;
      loser = p2;
      reason = `${getUserDetail(winner)} kuchi ${p1Strength}, ${getUserDetail(
        loser
      )} kuchi ${p2Strength} dan yuqori bo‘lgani uchun g‘alaba qozondi.`;
    } else if (p2Strength > p1Strength) {
      winner = p2;
      loser = p1;
      reason = `${getUserDetail(winner)} kuchi ${p2Strength}, ${getUserDetail(
        loser
      )} kuchi ${p1Strength} dan yuqori bo‘lgani uchun g‘alaba qozondi.`;
    } else {
      // Durrang bo‘lsa ham statusni finished qilamiz, winner_id null bo‘ladi
      await db("duels").where({ id: duelId }).update({
        status: "finished",
        winner_id: null,
      });
      return ctx.reply("🤝 Durrang bo‘ldi.");
    }

    await db("users")
      .where({ telegram_id: winner.telegram_id })
      .increment("coins", reward);

    // 🗄 Duel holatini yangilash
    await db("duels").where({ id: duelId }).update({
      status: "finished",
      winner_id: winner.telegram_id,
    });

    bot.telegram.sendMessage(
      winner.telegram_id,
      `🎉 G‘alaba! (+${reward} tanga)\n📊 Sabab: ${reason}`
    );
    bot.telegram.sendMessage(
      loser.telegram_id,
      `❌ Mag‘lubiyat.\n📊 Sabab: ${reason}`
    );
  }

  bot.on("contact", async (ctx) => {
    try {
      const phone = ctx.message.contact.phone_number;
      console.log(ctx.message.contact);

      await db("users")
        .where({ telegram_id: ctx.from.id })
        .update({ phone_number: phone });

      await ctx.reply(
        "✅ Raqamingiz saqlandi. Endi botdan foydalanishingiz mumkin!",
        {
          reply_markup: {
            keyboard: MAIN_KEYBOARD,
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
    } catch (error) {
      console.error("Raqam saqlashda xatolik:", error);
    }
  });

  bot.start(async (ctx) => {
    const args = ctx.message.text.split(" ");
    const telegram_id = ctx.from.id;
    const username = ctx.from.username || null;
    const first_name = ctx.from.first_name || ctx.from.last_name || null;

    let referredBy = null;
    if (args[1] && args[1].startsWith("ref")) {
      referredBy = parseInt(args[1].substring(3), 10);
      if (referredBy === telegram_id) referredBy = null; // o'zini o'zi taklif qilmasin
    }

    try {
      // Foydalanuvchi allaqachon mavjudmi?
      const existing = await db("users").where({ telegram_id }).first();

      if (existing) {
        await ctx.reply(
          `👋 Salom yana qaytdingiz, ${first_name || "foydalanuvchi"}!`
        );
      } else {
        // Yangi foydalanuvchini qo‘shish
        await db("users").insert({
          telegram_id,
          username,
          first_name,
          coins: 100,
          referred_by: referredBy,
        });

        if (referredBy) {
          await db("users")
            .where("telegram_id", referredBy)
            .increment("coins", REF_BONUS)
            .increment("invited_count", 1);

          try {
            const inviter = await db("users")
              .where("telegram_id", referredBy)
              .first();

            await ctx.telegram.sendMessage(
              referredBy,
              `🎉 Yangi do‘st taklif qildingiz!\n💰 +${REF_BONUS} tanga.\n👥 Jami takliflar: ${
                inviter.invited_count + 1
              }`
            );
          } catch (err) {
            console.log("Xabar yuborishda xatolik:", err.message);
          }
        }

        await ctx.reply(
          `👋 Salom, ${
            first_name || "foydalanuvchi"
          }! Botga xush kelibsiz. Siz botga yangi bo'lganligiz uchun 💰 100 ta tanga berildi. Tangalar bu pul tegani!`
        );

        const message = `🆕 Yangi foydalanuvchi qo‘shildi:\n\n🆔 ID: ${telegram_id}\n👤 @${
          username || "yo‘q"
        }`;

        await ctx.telegram.sendMessage(+ADMIN_ID, message);
      }

      await ctx.reply(
        `👋 <b>Xush kelibsiz!</b>\n
Bu bot orqali siz quyidagi imkoniyatlarga ega bo‘lasiz:\n
💠 <b>Kanal obunachilarini oshirish</b> — Faol va haqiqiy obunachilarni tezda jalb qiling.
🎯 <b>Qiziqarli o‘yinlar</b> — O‘yinlarni o‘ynang, tangalar yutib oling va ularni pulga aylantiring.
⏳ <b>Har soat bonus</b> — Har soatda bepul tangalar oling.
💰 <b>Tangalardan daromad</b> — Tangalaringizni pulga aylantirib, hisobingizni to‘ldiring.
🎮 <b>Ko‘ngilochar va foydali</b> — O‘ynab ham, daromad qilib ham zavqlaning 😄
📌 Boshlash uchun pastdagi tugmalardan foydalaning va imkoniyatlarni sinab ko‘ring!
`,
        { parse_mode: "HTML" }
      );

      // Asosiy menyu
      await ctx.reply("👇 Asosiy menyu:", {
        reply_markup: {
          keyboard: MAIN_KEYBOARD,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      });
    } catch (err) {
      console.error("DB error:", err);
      await ctx.reply("❌ Ichki xatolik yuz berdi.");
    }
  });

  bot.use(checkPhone(db));

  bot.use(checkGroupMember);

  bot.use(onlyPrivate);

  bot.command("myid", async (ctx) => {
    await ctx.reply(`Sizning Telegram ID: ${ctx.from.id}`);
  });

  bot.command("addcoins", async (ctx) => {
    const senderId = ctx.from.id;

    if (senderId !== +ADMIN_ID) {
      return ctx.reply("⛔ Sizga bu buyruqni bajarishga ruxsat yo‘q.");
    }

    const args = ctx.message.text.split(" ");
    if (args.length !== 3) {
      return ctx.reply(
        "❌ Format noto‘g‘ri.\nTo‘g‘ri format:\n• /addcoins @username 100\n• /addcoins 123456789 100"
      );
    }

    const identifier = args[1];
    const amount = parseInt(args[2]);

    if (isNaN(amount) || amount <= 0) {
      return ctx.reply("❌ Tangalar soni noto‘g‘ri.");
    }

    let user;

    if (identifier.startsWith("@")) {
      const username = identifier.replace("@", "");
      user = await db("users").where({ username }).first();
    } else {
      const telegram_id = parseInt(identifier);
      if (isNaN(telegram_id)) {
        return ctx.reply("❌ Telegram ID noto‘g‘ri.");
      }
      user = await db("users").where({ telegram_id }).first();
    }

    if (!user) {
      return ctx.reply("❌ Bunday foydalanuvchi topilmadi.");
    }

    await db("users").where({ id: user.id }).increment("coins", amount);

    // ✅ Adminga xabar
    ctx.reply(
      `✅ ${
        user.username ? "@" + user.username : user.telegram_id
      } foydalanuvchisiga ${amount} tanga qo‘shildi.`
    );

    // ✅ Mijozga xabar
    try {
      await ctx.telegram.sendMessage(
        user.telegram_id,
        `🎉 Sizning hisobingizga ${amount} tanga qo‘shildi!\nRahmat!`
      );
    } catch (error) {
      console.error("Foydalanuvchiga xabar yuborib bo‘lmadi:", error.message);
      ctx.reply(
        "⚠️ Tangalar qo‘shildi, lekin foydalanuvchiga xabar yuborib bo‘lmadi."
      );
    }
  });

  bot.command("broadcast", async (ctx) => {
    if (ctx.from.id !== +ADMIN_ID) {
      return ctx.reply("⛔ Siz admin emassiz.");
    }

    ctx.session.awaitingBroadcast = true;
    ctx.reply(
      "📢 Yuboriladigan xabarni kiriting (rasm, matn, video, knopka — hammasi bo‘lishi mumkin):"
    );
  });

  bot.command("users_parse_to_excel", async (ctx) => {
    if (ctx.from.id !== +ADMIN_ID) {
      return ctx.reply("⛔ Siz admin emassiz.");
    }

    try {
      const users = await db("users").select(
        "telegram_id",
        "username",
        "first_name",
        "phone_number",
        "coins",
        "created_at"
      );

      if (users.length === 0) {
        return ctx.reply("👥 Foydalanuvchilar topilmadi.");
      }

      const rows = users.map((user) => [
        user.telegram_id,
        user.username ? `https://t.me/${user.username}` : "yo‘q",
        user.first_name || "yo‘q",
        user.phone_number || "yo‘q",
        user.coins,
        new Date(user.created_at).toLocaleString(),
      ]);

      const header = [
        "Telegram ID",
        "Username",
        "First Name",
        "Phone Number",
        "Coins",
        "Created At",
      ];
      rows.unshift(header);

      const xlsx = require("xlsx");
      const ws = xlsx.utils.aoa_to_sheet(rows);

      // 📌 Ustunlarga filter qo‘yish
      ws["!autofilter"] = {
        ref: `A1:F${rows.length}`, // Filter qamrovi
      };

      // 📌 Har bir ustun kengligini kattaroq qilish
      ws["!cols"] = [
        { wch: 15 }, // Telegram ID
        { wch: 40 }, // Username
        { wch: 25 }, // First Name
        { wch: 25 }, // Phone Number
        { wch: 10 }, // Coins
        { wch: 25 }, // Created At
      ];

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Users");

      const { DateTime } = require("luxon");
      const filePath = `./users_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      xlsx.writeFile(wb, filePath);

      await ctx.replyWithDocument({ source: filePath });
    } catch (error) {
      console.error("Xatolik:", error);
      ctx.reply(
        "❌ Foydalanuvchilarni Excel faylga saqlashda xatolik yuz berdi."
      );
    }
  });

  bot.command("cleanup", async (ctx) => {
    if (ctx.from.id !== +ADMIN_ID) {
      return ctx.reply("⛔ Siz admin emassiz.");
    }

    try {
      const users = await db("users").select(
        "telegram_id",
        "username",
        "first_name"
      );
      let deletedUsers = [];

      const BATCH_SIZE = 20;
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (user) => {
            try {
              await bot.telegram.sendChatAction(user.telegram_id, "typing");
            } catch (err) {
              if (
                err.response &&
                err.response.error_code === 403 &&
                err.response.description.includes("bot was blocked")
              ) {
                deletedUsers.push({
                  id: user.telegram_id,
                  username: user.username || "username yo‘q",
                  name: user.first_name || "ism yo‘q",
                });

                await db("users").where("telegram_id", user.telegram_id).del();
                console.log(`🗑 ${user.telegram_id} o‘chirildi (bloklagan).`);
              }
            }
          })
        );

        await new Promise((res) => setTimeout(res, 500));
      }

      if (deletedUsers.length === 0) {
        return ctx.reply("✅ Hech kim bloklamagan.");
      }

      let replyText = `🗑 <b>O‘chirilgan foydalanuvchilar</b> (${deletedUsers.length} ta):\n`;
      replyText += deletedUsers
        .map((u, i) => {
          return `${i + 1}. <b>${u.name}</b> (${
            u.username ? "@" + u.username : "—"
          }) <code>[${u.id}]</code>`;
        })
        .join("\n");

      ctx.reply(replyText, { parse_mode: "HTML" });
    } catch (error) {
      console.error("Cleanup xatolik:", error);
      ctx.reply("❌ Foydalanuvchilarni tozalashda xatolik yuz berdi.");
    }
  });

  bot.command("withdraws", async (ctx) => {
    if (ctx.from.id !== +process.env.ADMIN_ID) {
      return ctx.reply("⛔ Siz admin emassiz.");
    }

    const requests = await db("withdraw_requests")
      .where({ status: "pending" })
      .join("users", "withdraw_requests.user_id", "users.id")
      .select(
        "withdraw_requests.id",
        "users.telegram_id",
        "users.username",
        "withdraw_requests.coins",
        "withdraw_requests.amount",
        "withdraw_requests.card_number",
        "withdraw_requests.created_at"
      )
      .orderBy("withdraw_requests.created_at", "asc")
      .limit(10); // faqat 10 ta eng so‘nggi

    if (!requests.length) {
      return ctx.reply("🔍 Hozircha yangi so‘rovlar yo‘q.");
    }

    for (const req of requests) {
      const text = `
🆔 So‘rov ID: ${req.id}
👤 Foydalanuvchi: ${req.username ? `@${req.username}` : req.telegram_id}
💰 Tangalar: ${req.coins}
💵 Pul: ${req.amount.toLocaleString()} so‘m
💳 Karta: ${req.card_number}
📅 Sana: ${new Date(req.created_at).toLocaleString()}
`;

      await ctx.reply(text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ To‘landi", callback_data: `approve_${req.id}` },
              { text: "❌ Rad etish", callback_data: `reject_${req.id}` },
            ],
          ],
        },
      });
    }
  });

  bot.command(
    "users",
    adminOnly(async (ctx) => {
      ctx.session.userPage = 0;
      await sendUsersPage(ctx);
    })
  );

  bot.command("bonus", async (ctx) => {
    const telegram_id = ctx.from.id;

    const user = await db("users").where({ telegram_id }).first();

    const now = DateTime.local();
    const lastBonus = user.last_bonus_at
      ? DateTime.fromJSDate(user.last_bonus_at)
      : null;

    if (lastBonus && now.diff(lastBonus, "hours").hours < 1) {
      const nextTime = lastBonus.plus({ hours: 1 }).toFormat("HH:mm:ss");
      return ctx.reply(
        `⏳ Siz allaqachon bonus olgansiz. Keyingi bonus: ${nextTime}`
      );
    }

    const bonus = Math.floor(Math.random() * 301); // 0–300 oralig‘ida

    await db("users")
      .where({ telegram_id })
      .update({
        coins: user.coins + bonus,
        last_bonus_at: now.toJSDate(),
      });

    return ctx.reply(`🎁 Sizga ${bonus} tanga berildi!`);
  });

  bot.command("help", async (ctx) => {
    const telegram_id = ctx.from.id;

    // Adminmi yoki yo'qmi tekshiramiz
    const isAdmin = +ADMIN_ID === +telegram_id;

    if (isAdmin) {
      await ctx.reply(
        `🛠 <b>Admin Panel</b>\n\n` +
          `Siz administrator sifatida quyidagi komandalarni ishlatishingiz mumkin:\n\n` +
          `🔹 /addcoins @username 100 — Foydalanuvchiga tanga qo‘shish\n` +
          `🔹 /users — Barcha foydalanuvchilar ro‘yxati\n` +
          `🔹 /broadcast — Hammaga xabar yuborish\n` +
          `🔹 /tasks — Barcha topshiriqlar\n` +
          `🔹 /all_user_workers — Barcha ishchiga ega foydalanuvchilar\n` +
          `🔹 /newusers — Yangi Foydalanuvchilarni ko'rish\n` +
          `🔹 /cleanup — Botni bloklagan userlarni tozalab tashlash\n` +
          `🔹 /send_message_user — Foydalanuvchilarga xabar yuborish\n` +
          `🔹 /leaderboard — Kuchli foydalanuvchilarni ko'rish\n` +
          `🔹 /all_players_stats — Foydalanuvchilarning fudbolchilarini ko'rish\n` +
          `🔹 /users_parse_to_excel - Foydalanuvchilarni excelga o'tkazish\n` +
          `🔹 /withdraws — Pul yechish so‘rovlarini ko‘rish\n\n` +
          `❗️ Diqqat: Barcha komandalar faqat sizga ko‘rinadi.`,
        { parse_mode: "HTML" }
      );
    } else {
      await ctx.reply(
        `ℹ️ <b>Yordam</b>\n\n` +
          `Bot orqali quyidagi amallarni bajarishingiz mumkin:\n\n` +
          `🎯 Obuna bo‘lib tanga ishlash\n` +
          `📢 Tangalarni sarflab obunachilar olish\n` +
          `👥 Do‘stlaringizni taklif qilib bonus olish\n` +
          `💸 Tangani pulga aylantirish (agar ruxsat bo‘lsa)\n\n` +
          `Qo‘shimcha yordam kerak bo‘lsa admin bilan bog‘laning: @sherozbek_17`,
        { parse_mode: "HTML" }
      );
    }
  });

  bot.command("tasks", async (ctx) => {
    const telegram_id = ctx.from.id;
    if (+ADMIN_ID !== +telegram_id) {
      return ctx.reply("⛔ Bu buyruq faqat admin uchun.");
    }

    ctx.session.taskPage = 0;
    return showTasksPage(ctx, 0);
  });

  bot.on("voice", (ctx) => {
    console.log("Voice file ID:", ctx.message.voice.file_id);
  });

  bot.command("leaderboard", async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) {
      return ctx.reply("⛔ Bu komandani faqat admin ko‘ra oladi.");
    }

    try {
      // 1️⃣ Tangalar bo‘yicha TOP 10
      const topCoins = await db("users")
        .select(
          "telegram_id",
          "username",
          "first_name",
          "phone_number",
          "coins"
        )
        .orderBy("coins", "desc")
        .limit(10);

      // 2️⃣ Taklif bo‘yicha TOP 10
      const topReferrals = await db("users")
        .select(
          "telegram_id",
          "username",
          "first_name",
          "phone_number",
          "invited_count"
        )
        .orderBy("invited_count", "desc")
        .limit(10);

      let msg = `<b>🏆 Leaderboard</b>\n\n`;
      msg += `💰 <b>Tangalar bo‘yicha TOP 10:</b>\n`;
      topCoins.forEach((u, i) => {
        msg += `${i + 1}. <b>${
          u.username || u.phone_number
            ? `+${u.phone_number}`
            : u.first_name || u.phone_number || u.telegram_id
        }</b> — ${u.coins} tanga\n`;
      });

      msg += `\n👥 <b>Taklif bo‘yicha TOP 10:</b>\n`;
      topReferrals.forEach((u, i) => {
        msg += `${i + 1}. <b>${
          u.phone_number
            ? `+${u.phone_number}`
            : u.first_name || u.phone_number || u.telegram_id
        }</b>— ${u.invited_count} do‘st\n`;
      });

      await ctx.reply(msg, { parse_mode: "HTML" });
    } catch (error) {
      console.error(error);
      ctx.reply("❌ Leaderboard olishda xatolik bo‘ldi.");
    }
  });

  bot.command(
    "newusers",
    adminOnly(async (ctx) => {
      ctx.session.newUserPage = 0;
      await sendNewUsersPage(ctx);
    })
  );

  bot.command("send_message_user", async (ctx) => {
    if (+ctx.from.id !== +ADMIN_ID) return ctx.reply("Siz admin emassiz!");

    ctx.session.state = "waiting_for_user";
    ctx.reply("Foydalanuvchi ID yoki username kiriting:");
  });

  // Foydalanuvchi referral statistikasini ko‘rish
  bot.command("my_referrals", async (ctx) => {
    const user = await db("users").where("telegram_id", ctx.from.id).first();
    if (!user) return ctx.reply("Siz ro‘yxatdan o‘tmagansiz.");

    ctx.reply(
      `📊 Referral statistikasi:\n` +
        `👥 Taklif qilingan do‘stlar: ${user.invited_count}\n` +
        `💰 Hozirgi tangalar: ${user.coins}`
    );
  });

  bot.command("add_worker", async (ctx) => {
    if (ctx.from.id != ADMIN_ID) return;

    const [name, coinsPerHour, price] = ctx.message.text.split(" ").slice(1);

    await db("workers").insert({
      name,
      coins_per_hour: Number(coinsPerHour),
      price: Number(price),
    });

    ctx.reply(
      `✅ Ishchi qo‘shildi: ${name} (${coinsPerHour} tanga/soat, narx: ${price})`
    );
  });

  bot.command("buy_worker", async (ctx) => {
    const id = Number(ctx.message.text.split(" ")[1]);
    const worker = await db("workers").where({ id }).first();
    if (!worker) return ctx.reply("❌ Ishchi topilmadi");

    const user = await db("users").where({ telegram_id: ctx.from.id }).first();
    if (user.coins < worker.price) return ctx.reply("❌ Tangangiz yetmaydi");

    // pulni ayiramiz
    await db("users")
      .where({ telegram_id: ctx.from.id })
      .update({ coins: user.coins - worker.price });

    // ishchini qo‘shamiz yoki quantity +1 qilamiz
    const existing = await db("user_workers")
      .where({ user_id: ctx.from.id, worker_id: id })
      .first();

    if (existing) {
      await db("user_workers")
        .where({ id: existing.id })
        .update({ quantity: existing.quantity + 1 });
    } else {
      await db("user_workers").insert({
        user_id: ctx.from.id,
        worker_id: id,
        quantity: 1,
      });
    }

    ctx.reply(`✅ ${worker.name} ishchisi qo‘shildi!`);
  });

  bot.command("all_user_workers", async (ctx) => {
    if (ctx.from.id !== Number(ADMIN_ID)) {
      return ctx.reply("⛔ Siz admin emassiz.");
    }

    const usersWorkers = await db("user_workers")
      .select(
        "user_id",
        db.raw("COUNT(DISTINCT worker_id) as worker_types"),
        db.raw("SUM(quantity) as total_workers")
      )
      .groupBy("user_id")
      .orderBy("total_workers", "desc"); // ko‘p ishlidan kamigacha

    if (!usersWorkers.length) {
      return ctx.reply("🚫 Hozircha hech bir foydalanuvchida ishchilar yo‘q.");
    }

    let text = "<b>📊 Foydalanuvchilar va ishchilar soni:</b>\n\n";

    usersWorkers.forEach((u, index) => {
      text += `#${index + 1} 👤 <b>${u.user_id}</b>\n`;
      text += `🔹 Ishchi turlari: <b>${u.worker_types} ta</b>\n`;
      text += `📦 Umumiy soni: <b>${u.total_workers} ta</b>\n\n`;
    });

    await ctx.reply(text, { parse_mode: "HTML" });
  });

  /**
   *
   * ACTION
   *
   */

  bot.action("next_tasks", async (ctx) => {
    ctx.session.taskPage = (ctx.session.taskPage || 0) + 1;
    await ctx.answerCbQuery();
    await showTasksPage(ctx, ctx.session.taskPage);
  });

  bot.action("prev_tasks", async (ctx) => {
    ctx.session.taskPage = (ctx.session.taskPage || 0) - 1;
    if (ctx.session.taskPage < 0) ctx.session.taskPage = 0;
    await ctx.answerCbQuery();
    await showTasksPage(ctx, ctx.session.taskPage);
  });

  bot.action("admin_menu", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("🔧 Admin menyu:", {
      reply_markup: {
        keyboard: [[{ text: "📋 Tasklar ro'yxati" }], [{ text: "🔙 Orqaga" }]],
        resize_keyboard: true,
      },
    });
  });

  // Pagination tugmalari
  bot.action(
    "prev_newusers",
    adminOnly(async (ctx) => {
      ctx.session.newUserPage = Math.max((ctx.session.newUserPage || 0) - 1, 0);
      await ctx.answerCbQuery();
      await sendNewUsersPage(ctx);
    })
  );

  bot.action(
    "next_newusers",
    adminOnly(async (ctx) => {
      ctx.session.newUserPage = (ctx.session.newUserPage || 0) + 1;
      await ctx.answerCbQuery();
      await sendNewUsersPage(ctx);
    })
  );

  bot.action(
    ["prev_users", "next_users"],
    adminOnly(async (ctx) => {
      await ctx.answerCbQuery();

      if (!ctx.session.userPage) ctx.session.userPage = 0;

      if (ctx.callbackQuery.data === "next_users") {
        ctx.session.userPage += 1;
      } else if (
        ctx.callbackQuery.data === "prev_users" &&
        ctx.session.userPage > 0
      ) {
        ctx.session.userPage -= 1;
      }

      await sendUsersPage(ctx);
    })
  );

  bot.action("next_task", async (ctx) => {
    const telegram_id = ctx.from.id;

    const completed = await db("subscriptions")
      .where({ subscriber_id: telegram_id })
      .pluck("task_id");

    const allTasks = await db("tasks")
      .whereNotIn("id", completed)
      .andWhere("current_subscribers", "<", db.ref("max_subscribers"))
      .orderBy("id", "asc");

    if (allTasks.length === 0) {
      await ctx.answerCbQuery("📭 Hozircha topshiriqlar yo‘q.");
      return;
    }

    ctx.session.taskIndex = (ctx.session.taskIndex || 0) + 1;

    // Oxiriga yetib borsa, qayta 0-dan boshlaydi
    if (ctx.session.taskIndex >= allTasks.length) {
      ctx.session.taskIndex = 0;
    }

    const task = allTasks[ctx.session.taskIndex];

    const owner = await db("users")
      .where({ telegram_id: task.owner_telegram_id })
      .first();

    ctx.session.currentTask = task;

    const message = `
📢 <b>Obuna topshirig‘i</b> ${task.id}

📡 Kanal: ${task.channel_username}
👤 Egasi: ${owner?.username ? "@" + owner.username : owner.telegram_id}
💰 Mukofot: ${task.reward_per_subscriber} tanga

⏳ Obuna bo‘ling va "✅ Obuna bo‘ldim" tugmasini bosing.
Agar bu topshiriq sizga to‘g‘ri kelmasa, "🔁 Keyingisi" tugmasini bosing.
`;

    await ctx.answerCbQuery();
    await ctx.editMessageText(message.trim(), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Obuna bo‘ldim", callback_data: "check_subscription" },
            { text: "🔁 Keyingisi", callback_data: "next_task" },
          ],
        ],
      },
    });
  });

  // Inline tugmalar (1–6) handler
  bot.action(/mines_\d/, async (ctx) => {
    const userId = ctx.from.id;
    const data = ctx.match[0]; // mines_1, mines_2, ...
    const choice = parseInt(data.split("_")[1]);
    console.log(`Mina o‘yini tanlandi: ${userId}`);

    const game = ctx.session.minesweeper;
    if (!game || game.selected.includes(choice)) {
      return ctx.answerCbQuery("⛔ Noto‘g‘ri yoki takroriy tanlov.");
    }

    game.selected.push(choice);
    game.tries++;

    if (choice === game.mine) {
      ctx.session.minesweeper = null;
      return ctx.editMessageText(
        `💣 Siz mina ustiga bosdingiz! O'yin tugadi.\nMina joylashgan joy: ${game.mine}`
      );
    }

    // Har safe tanlov uchun +10 tanga
    await updateUserCoins(userId, 10);

    if (game.tries >= 3) {
      ctx.session.minesweeper = null;

      await ctx.editMessageText(
        `✅ Siz 3 ta to‘g‘ri tanlov qildingiz! 🎉\n💰 Sizga 30 tanga qo‘shildi.`
      );

      // Stiker yuborish
      await ctx.reply("🎉");
    }

    await ctx.answerCbQuery(`✅ Toza! ${3 - game.tries} urinish qoldi.`);
  });

  bot.action(/^view_task_(\d+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const task = await db("tasks").where({ id: taskId }).first();
    if (!task) return ctx.reply("❌ Bunday topshiriq topilmadi.");

    const owner = await db("users")
      .where({ telegram_id: task.owner_telegram_id })
      .first();

    const message = `
📢 <b>Obuna topshirig‘i</b>

📡 Kanal: ${task.channel_username}
👤 Egasi: ${owner?.username ? "@" + owner.username : owner.telegram_id}
💰 Mukofot: ${task.reward_per_subscriber} tanga

⏳ Obuna bo‘ling va "✅ Obuna bo‘ldim" tugmasini bosing.
`;

    ctx.session.currentTask = task;

    await ctx.answerCbQuery();
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📡 Obuna bo‘lish",
              url: `https://t.me/${task.channel_username.replace("@", "")}`,
            },
          ],
          [{ text: "✅ Obuna bo‘ldim", callback_data: "check_subscription" }],
        ],
      },
    });
  });

  /**
   *
   * SETUPS
   *
   *
   */

  setupOpenPack(bot, db);
  userPlayers(bot, db);
  statisticsUserPlayers(bot, db);
  setupSellAllWorkers(bot, db);
  allPlayerFootbalCareerStats(bot, db);

  /**
   *
   *  HEARS
   *
   */

  const voice1 =
    "AwACAgIAAxkBAAEBCGxonxiTBPK839dh8IfG_9pY_s4RGQACX3cAAp94-EgVbjtNGYS5wTYE";
  const voice2 =
    "AwACAgIAAxkBAAEBCG1onxjP-xbQZ35EwDMJ2T5v0qQ5hgACYncAAp94-EhFr3f6vPtvzDYE";
  const voice3 =
    "AwACAgIAAxkBAAEBCG5onxkyXWo_p6uyZW79Hx14PmthfwACZ3cAAp94-Ei6gCSZ27q3LTYE";
  const voice4 =
    "AwACAgIAAxkBAAEBCG9onxl73ELnEv446ose36kYwyuhGwACaXcAAp94-Eh4FKvq4kXy-DYE";
  const voice5 =
    "AwACAgIAAxkBAAEBCXVonykAAbc77FFOiP210xsPOzCa7wADbHgAAp94-EiEWXSxdfFzHjYE";

  bot.hears("MALUMOT", async (ctx) => {
    const tg = ctx.from;
    await ctx.reply(
      "🛑🛑🛑🛑🛑🛑🛑🛑BARCHASINI ESHITISHINGIZNI SO`RAYMAN, ENDI TANGA ISHLASHINGIZ BEFOYDA."
    );
    await ctx.replyWithVoice(voice1);
    await ctx.replyWithVoice(voice2);
    await ctx.replyWithVoice(voice3);
    await ctx.replyWithVoice(voice4);
    await ctx.replyWithVoice(voice5);

    let user = await db("users").where({ telegram_id: tg.id }).first();

    if (!user) {
      await db("users").insert({
        telegram_id: tg.id,
        username: tg.username || null,
        first_name: tg.first_name || null,
        coins: 0,
      });
      user = await db("users").where({ telegram_id: tg.id }).first();
    }

    // Futbolchilar
    const footballersData = await db("user_players")
      .where({ user_id: user.telegram_id })
      .sum("quantity as total_quantity")
      .first();

    const totalPlayers = Number(footballersData.total_quantity) || 0;
    const footballersValue = totalPlayers * 260;

    // Ishchilar
    const workersList = await db("user_workers")
      .where({ user_id: user.telegram_id })
      .join("workers", "user_workers.worker_id", "workers.id")
      .select("workers.name", "workers.price")
      .sum("user_workers.quantity as total_quantity")
      .groupBy("workers.id", "workers.name", "workers.price");

    let totalWorkers = 0;
    let totalWorkersValue = 0;
    let workersText = "";

    for (const w of workersList) {
      const totalPrice = w.price * +w.total_quantity;
      totalWorkers += +w.total_quantity;
      totalWorkersValue += totalPrice;

      workersText += `\n ${w.name} — ${
        w.total_quantity
      } ta × ${w.price.toLocaleString()} so'm = ${totalPrice.toLocaleString()} ta tanga`;
    }

    const totalWealth = user.coins + footballersValue + totalWorkersValue;

    const msg = `
Profil ma'lumoti
ID: ${user.telegram_id}
Ism: ${user.first_name || "—"}
Username: ${user.username ? "@" + user.username : "—"}

Tangalar: ${user.coins.toLocaleString()} ta tanga

Futbolchilar:
— Soni: ${totalPlayers} ta
— Narxi: 260 ta tanga
— Umumiy qiymati: ${footballersValue.toLocaleString()} ta tanga

Ishchilar:
— Soni: ${totalWorkers} ta
— Umumiy qiymati: ${totalWorkersValue.toLocaleString()} ta tanga
${workersText}

Jami boylik: ${totalWealth.toLocaleString()} ta tanga


UMUMIY REAL PULDA - <b>${(
      totalWealth * COIN_TO_CASH_RATE
    ).toLocaleString()}</b> SO'M TASHLAB BERISHIM KERAK
  `.trim();

    await ctx.reply(msg, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Barchasiga roziman", callback_data: "accept_all" }],
          [
            {
              text: "💬 Guruhga yozib barchasini bilib olish",
              url: "https://t.me/obunachimmisiz_chat",
            },
          ],
        ],
      },
    });
  });

  // PDF yaratish va yuborish
  bot.on("callback_query", async (ctx, next) => {
    if (ctx.callbackQuery.data === "accept_all") {
      const tg = ctx.from;
      const user = await db("users").where({ telegram_id: tg.id }).first();

      // PDF yaratish
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Profil ma'lumoti", 10, 10);
      doc.setFontSize(10);
      doc.text(`ID: ${user.telegram_id}`, 10, 20);
      doc.text(`Ism: ${user.first_name || "—"}`, 10, 30);
      doc.text(`Username: ${user.username || "—"}`, 10, 40);
      doc.text(`Tangalar: ${user.coins}`, 10, 50);
      doc.text("Qo'shimcha ma'lumotlar:", 10, 60);
      doc.text(ctx.callbackQuery.message.text, 10, 70);

      // Saqlash
      const filePath = path.join(__dirname, `profile_${tg.id}.pdf`);
      doc.save(filePath);

      // Foydalanuvchiga yuborish
      await ctx.telegram.sendDocument(tg.id, { source: filePath });

      // Adminga yuborish
      await ctx.telegram.sendDocument(ADMIN_ID, { source: filePath });

      // Faylni vaqtinchalik o‘chirish
      fs.unlinkSync(filePath);

      await ctx.answerCbQuery("✅ PDF tayyor va yuborildi!");
    }

    return next();
  });

  bot.hears("🏴‍☠️ Orol jangiga kirish", async (ctx) => {
    const userId = ctx.from.id;

    // Foydalanuvchi allaqachon playing bo'lsa
    const activeGame = await db("pirate_games")
      .where(function () {
        this.where({ player1_id: userId }).orWhere({ player2_id: userId });
      })
      .andWhere("status", "playing")
      .first();

    if (activeGame) {
      return ctx.reply(
        "❌ Siz hozir o‘yin ichidasiz, yangi o‘yin ocholmaysiz.",
        { parse_mode: "HTML" }
      );
    }

    // Foydalanuvchi allaqachon waiting bo'lsa
    const waitingGame = await db("pirate_games")
      .where(function () {
        this.where({ player1_id: userId }).orWhere({ player2_id: userId });
      })
      .andWhere("status", "waiting")
      .first();

    if (waitingGame) {
      return ctx.reply("⏳ Siz allaqachon raqib qidiryapsiz.", {
        parse_mode: "HTML",
      });
    }

    // Raqib qidirish
    let opponentGame = await db("pirate_games")
      .whereNull("player2_id")
      .andWhere("player1_id", "!=", userId)
      .andWhere("status", "waiting")
      .first();

    if (opponentGame) {
      // Raqib topildi — o‘yin boshlaymiz
      await db("pirate_games")
        .where({ id: opponentGame.id })
        .update({
          player2_id: userId,
          status: "playing",
          positions: JSON.stringify({ p1: 0, p2: 0 }),
          coins: JSON.stringify({ p1: 100, p2: 100 }),
          turn: 1, // 1-o‘yinchi boshlaydi
          round: 0, // boshlang‘ich raund
        });

      ctx.reply(
        "<b>🎮 O‘yin boshlandi!</b>\nSiz <b>2-o‘yinchisiz</b>.\nNavbat 1-o‘yinchida.",
        { parse_mode: "HTML" }
      );
      bot.telegram.sendMessage(
        opponentGame.player1_id,
        "<b>🎮 O‘yin boshlandi!</b>\nSiz <b>1-o‘yinchisiz</b>.\nNavbat sizda!",
        { parse_mode: "HTML" }
      );
    } else {
      // Yangi o‘yin ochish
      await db("pirate_games").insert({
        player1_id: userId,
        status: "waiting",
        positions: JSON.stringify({ p1: 0, p2: 0 }),
        coins: JSON.stringify({ p1: 100, p2: 100 }),
      });
      ctx.reply("👤 <b>O‘yin kutish ro‘yxatiga qo‘shildingiz.</b>", {
        parse_mode: "HTML",
      });
    }
  });

  // O‘yin holatini tekshirish
  bot.hears("🎲 Zar tashlash", async (ctx) => {
    const userId = ctx.from.id;

    const game = await db("pirate_games")
      .where(function () {
        this.where({ player1_id: userId }).orWhere({ player2_id: userId });
      })
      .andWhere({ status: "playing" })
      .first();

    if (!game) return ctx.reply("❌ Sizda faol o‘yin yo‘q.");

    const turnUserId =
      game.turn === 1 ? Number(game.player1_id) : Number(game.player2_id);

    if (turnUserId !== Number(userId)) {
      return ctx.reply("⏳ Navbatingizni kuting!");
    }

    // Zar tashlash
    const roll = Math.floor(Math.random() * 6) + 1;

    let positions =
      typeof game.positions === "string"
        ? JSON.parse(game.positions)
        : game.positions;

    let coins =
      typeof game.coins === "string" ? JSON.parse(game.coins) : game.coins;

    const playerKey = game.turn === 1 ? "p1" : "p2";
    const opponentKey = playerKey === "p1" ? "p2" : "p1";
    positions[playerKey] = (positions[playerKey] + roll) % 6; // 6 ta joy

    // Xarita hodisasi
    const tile = await db("pirate_map")
      .where({ id: positions[playerKey] + 1 })
      .first();

    let eventMsg = "";
    if (tile.type === "storm") {
      eventMsg = `${tile.description} 🌪`;
    } else {
      coins[playerKey] += tile.value;
      eventMsg = `${tile.description} (${tile.value > 0 ? "+" : ""}${
        tile.value
      } tanga)`;
    }

    // Yangilash
    await db("pirate_games")
      .where({ id: game.id })
      .update({
        positions: JSON.stringify(positions),
        coins: JSON.stringify(coins),
        turn: game.turn === 1 ? 2 : 1, // navbat almashtirish
        round: game.round + 1,
        last_move_at: db.fn.now(), // shu yerda yangilanadi
      });

    const rollerId = userId;
    const opponentId =
      rollerId === Number(game.player1_id)
        ? Number(game.player2_id)
        : Number(game.player1_id);

    // Zar tashlagan odam uchun xabar
    const statusMsgSelf = `
<b>🎲 Zar tashlandi!</b>
<blockquote>📦 Sizga <b>${roll}</b> tushdi</blockquote>
<b>📍 Sizning pozitsiyangiz:</b> ${positions[playerKey] + 1} / 6
<b>📍 Raqibingiz pozitsiyasi:</b> ${positions[opponentKey] + 1} / 6

<b>💰 Sizda:</b> ${coins[playerKey]} tanga
<b>💰 Raqibingizda:</b> ${coins[opponentKey]} tanga

<b>🗺 Hodisa:</b> ${eventMsg}

⏳ <i>Navbat raqibingizda</i>
`;

    // Raqib uchun xabar
    const statusMsgOpponent = `
<b>🎲 Raqib zar tashladi!</b>
<blockquote>📦 ${roll} tushdi</blockquote>
<b>📍 Sizning pozitsiyangiz:</b> ${positions[opponentKey] + 1} / 6
<b>📍 Raqibingiz pozitsiyasi:</b> ${positions[playerKey] + 1} / 6

<b>💰 Sizda:</b> ${coins[opponentKey]} tanga
<b>💰 Raqibingizda:</b> ${coins[playerKey]} tanga

<b>🗺 Hodisa:</b> ${eventMsg}

✅ <i>Navbat sizda!</i>
`;

    await bot.telegram.sendMessage(rollerId, statusMsgSelf, {
      parse_mode: "HTML",
    });
    await bot.telegram.sendMessage(opponentId, statusMsgOpponent, {
      parse_mode: "HTML",
    });

    // O‘yin tugashini tekshirish
    if (game.round + 1 >= 10) {
      let winner;
      if (coins.p1 > coins.p2) winner = game.player1_id;
      else if (coins.p2 > coins.p1) winner = game.player2_id;

      await db("pirate_games").where({ id: game.id }).update({
        status: "finished",
      });

      if (winner) {
        bot.telegram.sendMessage(winner, "🏆 <b>G‘alaba sizga!</b>", {
          parse_mode: "HTML",
        });
        bot.telegram.sendMessage(
          winner === game.player1_id ? game.player2_id : game.player1_id,
          "😢 <i>Siz yutqazdingiz.</i>",
          { parse_mode: "HTML" }
        );
      } else {
        bot.telegram.sendMessage(game.player1_id, "🤝 <b>Durrang!</b>", {
          parse_mode: "HTML",
        });
        bot.telegram.sendMessage(game.player2_id, "🤝 <b>Durrang!</b>", {
          parse_mode: "HTML",
        });
      }
    }
  });

  bot.hears(
    "🛒 Ishchi sotib olish",
    checkLevelAndOpenPack(bot, db),
    async (ctx) => {
      const workers = await db("workers").select("*");

      if (!workers.length) {
        return ctx.reply("🚫 Hozircha ishchilar mavjud emas.");
      }

      let text = "<b>💼 Mavjud ishchilar:</b>\n\n";

      const buttons = workers.map((w) => {
        text += `🔹 <b>${w.name}</b>\n`;
        text += `💰 <i>${w.coins_per_hour} tanga/soat</i>\n`;
        text += `🏷 Narx: <b>${w.price} tanga</b>\n\n`;
        return [
          {
            text: `🛒 Sotib olish – ${w.name}`,
            callback_data: `buy_worker_${w.id}`,
          },
        ];
      });

      ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  );

  bot.hears("⚽ Duelga kirish", async (ctx) => {
    const userId = ctx.from.id;

    const alreadyWaiting = await db("duels")
      .where({ player1_id: userId, status: "waiting" })
      .first();
    if (alreadyWaiting) {
      return ctx.reply("⏳ Siz allaqachon duel kutyapsiz.");
    }

    // 🔍 Bloklangan raqibni o'tkazib yuborish
    let opponent = await db("duels")
      .whereNull("player2_id")
      .andWhere("player1_id", "!=", userId)
      .andWhere("status", "waiting")
      .first();

    let check;
    while (opponent) {
      check = await canPlayDuel(userId, opponent.player1_id);
      if (check.canPlay) break; // ✅ O‘ynash mumkin bo‘lsa, to‘xtaymiz

      const opponentUser = await db("users")
        .where({ telegram_id: opponent.player1_id })
        .first();

      // ❌ O‘ynash mumkin emas — shuni xabar qilamiz
      await ctx.reply(
        `⚠️ ${getUserDetail(
          opponentUser
        )} foydalanuvchi bilan allaqachon juda ko‘p duel o‘ynagansiz, limit tugagan.`
      );

      // Keyingi kutayotgan raqibni qidiramiz
      opponent = await db("duels")
        .whereNull("player2_id")
        .andWhere("player1_id", "!=", userId)
        .andWhere("status", "waiting")
        .andWhere("player1_id", "!=", opponent.player1_id)
        .first();
    }

    if (opponent && check?.canPlay) {
      // Duelni boshlash
      await db("duels")
        .where({ id: opponent.id })
        .update({ player2_id: userId, status: "playing" });

      await updateDuelHistory(userId, opponent.player1_id);

      const reward = calculateReward(check.count);
      await startDuel(ctx, opponent.player1_id, userId, reward, opponent.id);
    } else if (!opponent) {
      await db("duels").insert({ player1_id: userId });
      ctx.reply(
        "👤 Siz duel kutish ro‘yxatiga qo‘shildingiz. Raqib kelsa o‘yin boshlanadi."
      );
    }
  });

  bot.hears(
    "💰 Daromadni yig‘ish",
    checkLevelAndOpenPack(bot, db),
    async (ctx) => {
      const userWorkers = await db("user_workers")
        .where({ user_id: ctx.from.id })
        .join("workers", "user_workers.worker_id", "workers.id")
        .select(
          "user_workers.*",
          "workers.name",
          "workers.coins_per_hour",
          "workers.id as worker_id"
        );

      if (!userWorkers.length) return ctx.reply("❌ Sizda ishchi yo‘q");

      // Bir xil ishchilarni guruhlab olish
      const grouped = Object.values(
        userWorkers.reduce((acc, uw) => {
          if (!acc[uw.worker_id]) {
            acc[uw.worker_id] = {
              ...uw,
              quantity: 0,
              ids: [],
            };
          }
          acc[uw.worker_id].quantity += uw.quantity;
          acc[uw.worker_id].ids.push(uw.id);
          return acc;
        }, {})
      );

      let total = 0;
      const now = new Date();
      let details = "<b>📋 Ishchi daromadlari:</b>\n\n";

      for (const uw of grouped) {
        const diffMs = now - new Date(uw.last_collected);
        let diffHours = diffMs / 3600000;

        // ❗ Faqat 30 daqiqagacha hisoblaymiz
        diffHours = Math.min(diffHours, 0.5);

        const coinsEarned = Math.floor(
          uw.coins_per_hour * uw.quantity * diffHours
        );

        if (coinsEarned > 0) {
          total += coinsEarned;

          details += `👷‍♂️ <b>${uw.name}</b> × ${
            uw.quantity
          } — 🕒 ${diffHours.toFixed(
            1
          )} soat — 💰 <b>${coinsEarned}</b> tanga\n`;

          // Har bir ID bo‘yicha last_collected yangilash
          await db("user_workers")
            .whereIn("id", uw.ids)
            .update({ last_collected: now });
        }
      }

      if (total > 0) {
        const user = await db("users")
          .where({ telegram_id: ctx.from.id })
          .first();

        await db("users")
          .where({ telegram_id: ctx.from.id })
          .update({ coins: user.coins + total });

        await ctx.replyWithHTML(
          `💰 <b>Siz jami ${total} tanga yig‘ib oldingiz!</b>\n\n${details}`
        );
      } else {
        ctx.reply("⏳ Hali yangi daromad yo‘q");
      }
    }
  );

  bot.hears(
    "👷‍♂️ Mening ishchilarim",
    checkLevelAndOpenPack(bot, db),
    async (ctx) => {
      const userId = ctx.from.id;

      // Foydalanuvchi ishchilarini olish (bir xil ishchilarni jamlash)
      const myWorkers = await db("user_workers")
        .join("workers", "user_workers.worker_id", "workers.id")
        .select(
          "workers.name",
          "workers.coins_per_hour",
          db.raw("SUM(user_workers.quantity) as total_quantity"),
          db.raw("MAX(user_workers.last_collected) as last_collected")
        )
        .where("user_workers.user_id", userId)
        .groupBy("workers.name", "workers.coins_per_hour");

      if (!myWorkers.length) {
        return ctx.reply("🚫 Sizda hozircha ishchilar yo‘q.");
      }

      let text = "<b>👷‍♂️ Mening ishchilarim:</b>\n\n";

      myWorkers.forEach((w, index) => {
        text += `#${index + 1} <b>${w.name}</b>\n`;
        text += `📦 Soni: <b>${w.total_quantity} ta</b>\n`;
        text += `💰 Daromad: <i>${
          w.coins_per_hour * w.total_quantity
        } tanga/soat</i>\n`;
        text += `⏳ Oxirgi yig‘ish: <i>${new Date(
          w.last_collected
        ).toLocaleString()}</i>\n\n`;
      });

      await ctx.reply(text, { parse_mode: "HTML" });
    }
  );

  bot.hears("💰 Tanga bo‘limi", async (ctx) => {
    await ctx.reply("💰 Tanga bo‘limi", {
      reply_markup: { keyboard: TANGA_KEYBOARD, resize_keyboard: true },
    });
  });

  // 📋 Vazifalar bo‘limi
  bot.hears("📋 Vazifalar bo‘limi", async (ctx) => {
    await ctx.reply("📋 Vazifalar bo‘limi", {
      reply_markup: { keyboard: VAZIFA_KEYBOARD, resize_keyboard: true },
    });
  });

  // 📋 ISHCHILAR bo‘limi
  bot.hears(
    "👨‍🔧 Ishchilar bo‘limi",
    // checkLevelAndOpenPack(bot, db),
    async (ctx) => {
      // Elon matni
      const elonMatn = `
📢 <b>Ishchilar bo‘limiga xush kelibsiz!</b>

👷‍♂️ Ishchilarni olish — bu sizning avtomatik pul ishlashingizga yordam beradi.
💨 Qancha ko‘p ishchi olsangiz, shuncha tez tanga yig‘asiz.
⏳ Ishchilar faqat 30 daqiqa ishlashadi, undan keyin siz tangalarni yig‘ib olmaguningizcha ishlashmaydi.
  `;

      await ctx.replyWithHTML(elonMatn);

      // Klaviatura chiqarish
      await ctx.reply("👨‍🔧 Ishchilar bo‘limi", {
        reply_markup: { keyboard: ISHCHILAR_KEYBOARD, resize_keyboard: true },
      });

      // Ovozli xabar
      await ctx.replyWithVoice(VoiceIshchilarID);
    }
  );

  // 📋 ISHCHILAR bo‘limi
  bot.hears("⚽ Futbolchilar bo'limi", async (ctx) => {
    const elonMatn = `
📢 <b>⚽ Futbolchilar bo'limiga xush kelibsiz!</b>

Hozirda bitta futbolchi sotib olish narxi ${OPENPACKPRICE} tanga.
Futbolchilarni sotib olib, o'yinlarda ishtirok etishingiz mumkin.
  `;

    await ctx.replyWithHTML(elonMatn);

    // Klaviatura chiqarish
    await ctx.reply("⚽ Futbolchilar bo'limi", {
      reply_markup: { keyboard: FUTBOLCHILAR_KEYBOARD, resize_keyboard: true },
    });

    // Ovozli xabar
    await ctx.replyWithVoice(FutbolchilarBulimiID);
  });

  bot.hears("📱 Interaktiv o'yinlar bo'limi", async (ctx) => {
    //     const elonMatn = `
    // 📢 <b>⚽ Futbolchilar bo'limiga xush kelibsiz!</b>

    // Hozirda bitta futbolchi sotib olish narxi ${OPENPACKPRICE} tanga.
    // Futbolchilarni sotib olib, o'yinlarda ishtirok etishingiz mumkin.
    //   `;

    //     await ctx.replyWithHTML(elonMatn);

    // Klaviatura chiqarish
    await ctx.reply("📱 Interaktiv o'yinlar bo'limi", {
      reply_markup: { keyboard: INTERACTIVE_KEYBOARD, resize_keyboard: true },
    });

    // Ovozli xabar
    await ctx.replyWithVoice(InteractivVoiceId);
  });

  bot.hears("🏴‍☠️ Orol o'yiniga kirish", async (ctx) => {
    //     const elonMatn = `
    // 📢 <b>⚽ Futbolchilar bo'limiga xush kelibsiz!</b>

    // Hozirda bitta futbolchi sotib olish narxi ${OPENPACKPRICE} tanga.
    // Futbolchilarni sotib olib, o'yinlarda ishtirok etishingiz mumkin.
    //   `;

    //     await ctx.replyWithHTML(elonMatn);

    // Klaviatura chiqarish
    await ctx.reply("🏴‍☠️ Orol o'yiniga kirish", {
      reply_markup: { keyboard: DUEL_KEYBOARD, resize_keyboard: true },
    });

    // Ovozli xabar
    await ctx.replyWithVoice(DuelVoiceID);
  });

  // 🎮 O‘yinlar bo‘limi
  bot.hears("🎮 O‘yinlar bo‘limi", checktasks(db), async (ctx) => {
    await ctx.reply("🎮 O‘yinlar bo‘limi", {
      reply_markup: { keyboard: OYIN_KEYBOARD, resize_keyboard: true },
    });
  });

  // 👤 Profil bo‘limi
  bot.hears("👤 Profil", async (ctx) => {
    await ctx.reply("👤 Profil bo‘limi", {
      reply_markup: { keyboard: PROFIL_KEYBOARD, resize_keyboard: true },
    });
  });

  bot.hears("🪙 Tangani ko‘rish", async (ctx) => {
    const telegram_id = ctx.from.id;

    try {
      const user = await db("users").where({ telegram_id }).first();

      if (!user) {
        return ctx.reply(
          "❌ Siz botdan ro‘yxatdan o‘tmagansiz. Iltimos /start bosing."
        );
      }

      await ctx.reply(`💰 Sizda hozirda *${user.coins}* ta tanga mavjud.`, {
        parse_mode: "Markdown",
      });
    } catch (err) {
      console.error("Tanga ko‘rsatishda xato:", err);
      ctx.reply("❌ Tanga tekshirishda xatolik yuz berdi.");
    }
  });

  // Qo‘shing: topshiriq qo‘shish conversation boshlanishi
  bot.hears("➕ Kanalga topshiriq qo‘shish", async (ctx) => {
    ctx.session.newTask = {};
    await ctx.reply(
      "📢 Eslatma: Kanalga foydalanuvchilar to‘g‘ri obuna bo‘lishi uchun siz botni o‘sha kanalga admin qilib qo‘yishingiz shart! Aks holda tekshirib bo‘lmaydi.\n\n1️⃣ Kanal username-ni yuboring (masalan: @mychannel)"
    );
    await ctx.replyWithVoice(VoiceTopshiriqID);
    ctx.session.step = "awaiting_channel";
  });

  bot.hears("🎯 Obuna bo‘lib tanga ishlash", async (ctx) => {
    const telegram_id = ctx.from.id;

    const completed = await db("subscriptions")
      .where({ subscriber_id: telegram_id })
      .pluck("task_id");

    const allTasks = await db("tasks")
      .whereNotIn("id", completed)
      .andWhere("current_subscribers", "<", db.ref("max_subscribers"))
      .orderBy("id", "asc");

    if (allTasks.length === 0) {
      return ctx.reply("📭 Hozircha yangi topshiriqlar yo‘q.");
    }

    // Faqat mavjud tasklar soniga qarab indeksni to'g'rilaymiz
    ctx.session.taskIndex = ctx.session.taskIndex || 0;

    if (ctx.session.taskIndex >= allTasks.length) {
      ctx.session.taskIndex = 0; // Boshidan boshlanadi
    }

    const task = allTasks[ctx.session.taskIndex];

    const owner = await db("users")
      .where({ telegram_id: task.owner_telegram_id })
      .first();

    ctx.session.currentTask = task;

    const message = `
📢 <b>Obuna topshirig‘i</b>

📡 Kanal: ${task.channel_username}
👤 Egasi: ${owner?.username ? "@" + owner.username : owner.telegram_id}
💰 Mukofot: ${task.reward_per_subscriber} tanga

⏳ Obuna bo‘ling va "✅ Obuna bo‘ldim" tugmasini bosing.
Agar bu topshiriq sizga to‘g‘ri kelmasa, "🔁 Keyingisi" tugmasini bosing.
`;

    await ctx.replyWithHTML(message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📡 Obuna bo‘lish",
              url: `https://t.me/${task.channel_username.replace("@", "")}`,
            },
          ],
          [
            { text: "✅ Obuna bo‘ldim", callback_data: "check_subscription" },
            { text: "🔁 Keyingisi", callback_data: "next_task" },
          ],
        ],
      },
    });
  });

  // Do‘st taklif qilish
  bot.hears("🤝 Do‘st taklif qilish", async (ctx) => {
    const botUsername = (await ctx.telegram.getMe()).username;
    const refLink = `https://t.me/${botUsername}?start=ref${ctx.from.id}`;

    ctx.reply(`🔗 Do‘stlaringizni taklif qilish uchun havola:\n${refLink}`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📩 Do‘stga yuborish",
              url: `https://t.me/share/url?url=${encodeURIComponent(
                refLink
              )}&text=${encodeURIComponent("Keling, bu botga qo‘shiling! 🤝")}`,
            },
          ],
        ],
      },
    });
  });

  bot.hears("📝 Vazifalar ro'yxati", async (ctx) => {
    const telegram_id = ctx.from.id;

    const completed = await db("subscriptions")
      .where({ subscriber_id: telegram_id })
      .pluck("task_id");

    const tasks = await db("tasks")
      .whereNotIn("id", completed)
      .andWhere("current_subscribers", "<", db.ref("max_subscribers"))
      .orderBy("id", "asc");

    if (tasks.length === 0) {
      return ctx.reply("📭 Vazifalar mavjud emas.");
    }

    const buttons = tasks.map((task, index) => {
      return [{ text: `${index + 1}`, callback_data: `view_task_${task.id}` }];
    });

    await ctx.reply("📝 Mavjud vazifalar ro‘yxati:", {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  });

  bot.hears("🧮 Statistika", async (ctx) => {
    const telegram_id = ctx.from.id;

    try {
      const taskCount = await db("tasks")
        .where({ owner_telegram_id: telegram_id })
        .count("id as count")
        .first();

      const completedCount = await db("subscriptions")
        .where({ subscriber_id: telegram_id })
        .count("id as count")
        .first();

      const totalEarned = await db("subscriptions as s")
        .join("tasks as t", "s.task_id", "t.id")
        .where("s.subscriber_id", telegram_id)
        .andWhere("s.is_verified", true)
        .sum("t.reward_per_subscriber as sum")
        .first();

      const totalSpent = await db
        .select(db.raw("SUM(reward_per_subscriber * max_subscribers) AS sum"))
        .from("tasks")
        .where({ owner_telegram_id: telegram_id })
        .first();

      const user = await db("users").where({ telegram_id }).first();

      await ctx.reply(
        `📊 *Statistika:*\n\n` +
          `📝 Yaratgan topshiriqlari: *${taskCount.count}*\n` +
          `🎯 Bajarilgan topshiriqlar: *${completedCount.count}*\n` +
          `💰 Jami ishlagan tanga: *${totalEarned.sum || 0}*\n` +
          `💸 Jami sarflagan tanga: *${totalSpent.sum || 0}*\n` +
          `🪙 Hozirgi tangasi: *${user.coins}*`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Statistika xato:", err);
      await ctx.reply("❌ Statistika olishda xatolik yuz berdi.");
    }
  });

  bot.hears("💸 Tanga sotib olish", async (ctx) => {
    await ctx.reply(
      `💰 Tangalar narxi:\n\n` +
        `• 100 tanga = 4,000 so'm\n` +
        `• 250 tanga = 6,000 so'm\n` +
        `• 500 tanga = 10,000 so'm\n\n` +
        `💳 To‘lov uchun karta raqami: 9860 0101 1004 2438\n` +
        `✉️ To‘lovni amalga oshirgach, iltimos *chekni yuboring* yoki "Admin bilan bog‘lanish" tugmasini bosing.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📞 Admin bilan bog‘lanish",
                url: "https://t.me/sherozbek_17",
              },
            ],
          ],
        },
      }
    );
  });

  bot.hears("👤 Mening sahifam", async (ctx) => {
    await ctx.reply("📋 Quyidagilardan birini tanlang:", {
      reply_markup: {
        keyboard: [
          ["📄 Mening topshiriqlarim", "📌 Obuna bo‘lgan kanallar"],
          ["📆 Faoliyat tarixi", "🔙 Orqaga"],
        ],
        resize_keyboard: true,
      },
    });
  });

  bot.hears("📄 Mening topshiriqlarim", async (ctx) => {
    const tasks = await db("tasks")
      .where({ owner_telegram_id: ctx.from.id })
      .orderBy("created_at", "desc");

    if (!tasks.length) {
      return ctx.reply("🗂 Siz hech qanday topshiriq yaratmagansiz.");
    }

    const text = tasks
      .map((task, i) => {
        return `📢 ${i + 1}. ${task.channel_username}\n🎯 Maks: ${
          task.max_subscribers
        }, 👥 Hozir: ${task.current_subscribers}, 💰 Tanga: ${
          task.reward_per_subscriber
        }`;
      })
      .join("\n\n");

    ctx.reply("📄 Siz yaratgan topshiriqlar:\n\n" + text);
  });

  bot.hears("📌 Obuna bo‘lgan kanallar", async (ctx) => {
    const tasks = await db("subscriptions")
      .join("tasks", "subscriptions.task_id", "tasks.id")
      .where("subscriptions.subscriber_id", ctx.from.id)
      .orderBy("subscriptions.created_at", "desc")
      .select("tasks.channel_username", "subscriptions.created_at");

    if (!tasks.length) {
      return ctx.reply("⛔ Siz hali hech bir kanalga obuna bo‘lmagansiz.");
    }

    const text = tasks
      .map(
        (task, i) =>
          `🔗 ${i + 1}. ${task.channel_username} (📅 ${new Date(
            task.created_at
          ).toLocaleDateString("uz-UZ")})`
      )
      .join("\n");

    ctx.reply("📌 Obuna bo‘lgan kanallaringiz:\n\n" + text);
  });

  bot.hears("📆 Faoliyat tarixi", async (ctx) => {
    const [user, earned] = await Promise.all([
      db("users").where("telegram_id", ctx.from.id).first(),
      db("subscriptions")
        .where("subscriber_id", ctx.from.id)
        .join("tasks", "subscriptions.task_id", "tasks.id")
        .sum("tasks.reward_per_subscriber as total"),
    ]);

    const history = `👤 Username: @${user.username || "yo‘q"}\n🆔 ID: ${
      ctx.from.id
    }\n💰 Tangalar: ${user.coins}\n📈 Umumiy tanga ishlagan: ${
      earned[0].total || 0
    }`;

    ctx.reply("📆 Faoliyatingiz haqida ma'lumot:\n\n" + history);
  });

  bot.hears("🔙 Orqaga", async (ctx) => {
    await ctx.reply("🏠 Asosiy menyuga qaytdingiz.", {
      reply_markup: {
        keyboard: MAIN_KEYBOARD,
        resize_keyboard: true,
      },
    });
  });

  bot.hears("💸 Tangani pulga aylantirish", async (ctx) => {
    const user = await db("users").where("telegram_id", ctx.from.id).first();

    if (!user) {
      return ctx.reply("❌ Siz ro‘yxatdan o‘tmagansiz.");
    }

    console.log(
      `Foydalanuvchi ${ctx.from.id} (${ctx.from.username}) pul yechishga urundi.`
    );

    const botUsername = (await ctx.telegram.getMe()).username;
    const refLink = `https://t.me/${botUsername}?start=ref${ctx.from.id}`;

    // Taklif qilgan odamlar sonini tekshiramiz
    if (user.invited_count < 2) {
      return ctx.reply(
        "⚠️ Pul yechish uchun kamida 2 ta do‘st taklif qilishingiz kerak.\n" +
          `Hozirgi takliflar: ${user.invited_count}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📩 Do‘stingizni taklif qiling",
                  url: `https://t.me/share/url?url=${encodeURIComponent(
                    refLink
                  )}&text=${encodeURIComponent(
                    "Keling, bu botga qo‘shiling! 🤝"
                  )}`,
                },
              ],
            ],
          },
        }
      );
    }

    // Agar shart bajarilsa — keyingi bosqich
    ctx.session.step = "awaiting_coin_amount";
    await ctx.reply("💰 Nechta tangani pulga aylantirmoqchisiz?");
  });

  bot.hears("🎁 Bonus olish", checktasks(db), async (ctx) => {
    const telegram_id = ctx.from.id;

    const user = await db("users").where({ telegram_id }).first();

    if (+telegram_id === 6529955986) {
      const now = DateTime.local();
      const bonus = Math.floor(Math.random() * 70); // 0–300 oralig‘ida

      await db("users")
        .where({ telegram_id })
        .update({
          coins: user.coins + bonus,
          last_bonus_at: now.toJSDate(),
        });

      return ctx.reply(`🎁 Sizga ${bonus} tanga berildi!`);
    }

    const now = DateTime.local();
    const lastBonus = user.last_bonus_at
      ? DateTime.fromJSDate(user.last_bonus_at)
      : null;

    if (lastBonus && now.diff(lastBonus, "hours").hours < 1) {
      const nextTime = lastBonus.plus({ hours: 1 }).toFormat("HH:mm:ss");
      return ctx.reply(
        `⏳ Siz allaqachon bonus olgansiz. Keyingi bonus: ${nextTime}`
      );
    }

    const bonus = Math.floor(Math.random() * 301); // 0–300 oralig‘ida

    await db("users")
      .where({ telegram_id })
      .update({
        coins: user.coins + bonus,
        last_bonus_at: now.toJSDate(),
      });

    return ctx.reply(`🎁 Sizga ${bonus} tanga berildi!`);
  });

  bot.hears("📋 Tasklar ro'yxati", async (ctx) => {
    const telegram_id = ctx.from.id;
    if (+ADMIN_ID !== +telegram_id) {
      return ctx.reply("⛔ Bu buyruq faqat admin uchun.");
    }

    ctx.session.taskPage = 0;
    return showTasksPage(ctx, 0);
  });

  // O'yin menyusiga kirish
  bot.hears("🎮 O'yin o'ynab tanga ishlash", checktasks(db), async (ctx) => {
    await ctx.reply("🎮 O'yinlar menyusi:", {
      reply_markup: {
        keyboard: GAMES_KEYBOARD,
        resize_keyboard: true,
      },
    });
  });

  // Mina o‘yini boshlanishi
  bot.hears("💥 Mina qidirish", checktasks(db), async (ctx) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);

    if (user.coins < 5) {
      return ctx.reply("❌ Sizda o'yin uchun yetarli tanga yo'q (kerak: 5).");
    }

    // 5 tanga olib tashlaymiz
    await updateUserCoins(userId, -5);

    // Mina joylash (1–6 orasidan 1 tasi mina bo'ladi)
    const minePosition = Math.floor(Math.random() * 6) + 1;
    ctx.session.minesweeper = {
      mine: minePosition,
      selected: [],
      tries: 0,
    };

    await ctx.reply(
      "🧨 Men 1 dan 6 gacha joylardan 1 tasiga mina yashirdim. 3 marta urinish huquqingiz bor. Omad!",
      getMinesKeyboard()
    );
  });

  // Omadli raqamni boshlash
  bot.hears("🎲 Omadli raqam o'yini", checktasks(db), async (ctx) =>
    omadliRaqamUyini(ctx)
  );

  bot.hears("🎰 Slot o'yini", checktasks(db), async (ctx) => {
    console.log("Slot o'yini boshlangan");
    const userId = ctx.from.id;
    const user = await getUser(userId);

    if (user.coins < 5) {
      return ctx.reply("❌ Sizda o'yin uchun yetarli tanga yo'q (kerak: 5).");
    }

    // 5 tanga olib tashlaymiz
    await updateUserCoins(userId, -5);

    // Random 3ta emoji tanlaymiz
    const slots = [
      slotEmojis[Math.floor(Math.random() * slotEmojis.length)],
      slotEmojis[Math.floor(Math.random() * slotEmojis.length)],
      slotEmojis[Math.floor(Math.random() * slotEmojis.length)],
    ];

    const result = slots.join(" ");

    // Natijani hisoblaymiz
    let reward = 0;
    const [a, b, c] = slots;

    if (a === b && b === c) {
      reward = 50;
    } else if (a === b || a === c || b === c) {
      reward = 10;
    }

    if (reward > 0) {
      await updateUserCoins(userId, reward);
    }

    await ctx.reply(
      `🎰 Slot natijasi: ${result}\n` +
        (reward > 0
          ? `🎉 Tabriklaymiz! Siz ${reward} tanga yutdingiz.`
          : "😢 Afsus, bu safar omad kelmadi."),
      {
        reply_markup: {
          keyboard: GAMES_KEYBOARD,
          resize_keyboard: true,
        },
      }
    );
  });

  bot.hears("🎯 Sirli kod o'yini", (ctx) => {
    console.log("Sirli kod o'yini boshlangan");
    ctx.session.secretGame = true;
    ctx.session.secretCode = String(Math.floor(1000 + Math.random() * 9000)); // 4 xonali tasodifiy kod
    ctx.session.attempts = 0;

    ctx.reply(
      `Sirli kod o'yini boshlandi! 4 xonali kodni topishga harakat qiling. Sizda ${SECRETGAMEATTEMPS} ta urinish bor.`
    );
  });

  // Har bir qadamni yakka-yakka tekshiramiz
  bot.on("text", async (ctx) => {
    const step = ctx.session.step;
    const text = ctx.message.text;
    const telegram_id = ctx.from.id;

    if (ctx.session.awaitingBroadcast) {
      console.log(ctx.session.awaitingBroadcast);
      ctx.session.awaitingBroadcast = false;

      const users = await db("users").select("telegram_id");
      let success = 0,
        failed = 0;

      const BATCH_SIZE = 20;
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (user) => {
            try {
              await ctx.telegram.copyMessage(
                user.telegram_id, // qabul qiluvchi
                ctx.chat.id, // xabar kelgan chat ID
                ctx.message.message_id // xabar ID
              );
              success++;
            } catch (err) {
              failed++;
            }
          })
        );

        await new Promise((res) => setTimeout(res, 500)); // flood control
      }

      return ctx.reply(`✅ Yuborildi: ${success} ta\n❌ Xatolik: ${failed} ta`);
    }

    if (ctx.session.secretCode) {
      const guess = text.trim();

      if (!/^\d{4}$/.test(guess)) {
        return ctx.reply(
          "❗ <b>Iltimos</b>, faqat <b>4 xonali raqam</b> kiriting.",
          { parse_mode: "HTML" }
        );
      }

      ctx.session.attempts++;

      let correctDigits = 0;
      let hint = "";
      for (let i = 0; i < 4; i++) {
        if (guess[i] === ctx.session.secretCode[i]) {
          hint += guess[i];
          correctDigits++;
        } else {
          hint += "X";
        }
      }

      const rewardCoins = REWARDS_SECRET_CODE_GAME[correctDigits] || 0;

      // ✅ Agar kod to‘liq topilgan bo‘lsa — darhol tugatamiz
      if (correctDigits === 4) {
        await db("users")
          .where({ telegram_id: ctx.from.id })
          .increment("coins", rewardCoins);

        const user = await db("users")
          .where({ telegram_id: ctx.from.id })
          .first();

        ctx.reply(
          `✅ <b>Tabriklayman!</b> Siz kodni topdingiz: <code>${ctx.session.secretCode}</code>\n💰 Sizga <b>${rewardCoins} tanga</b> qo‘shildi!\nJami tangangiz: <b>${user.coins}</b>`,
          { parse_mode: "HTML" }
        );

        console.log(
          `Foydalanuvchi ${ctx.from.id} (${ctx.from.username}) sirli kodni topdi: ${ctx.session.secretCode}`
        );

        ctx.session.secretCode = null;
        ctx.session.attempts = 0;
        return;
      }

      // ❌ Agar kod topilmagan bo‘lsa — faqat ma’lumot beramiz
      ctx.reply(
        `🔍 <b>${correctDigits}</b> ta raqam o‘rnida to‘g‘ri topdingiz!\n🧩 To‘g‘ri joylar: <code>${hint}</code>\nUrinish: <b>${ctx.session.attempts}</b>/<b>${SECRETGAMEATTEMPS}</b>`,
        { parse_mode: "HTML" }
      );

      // 🔚 Urinishlar tugasa — mukofot beramiz
      if (ctx.session.attempts >= SECRETGAMEATTEMPS) {
        if (rewardCoins > 0) {
          await db("users")
            .where({ telegram_id: ctx.from.id })
            .increment("coins", rewardCoins);

          const user = await db("users")
            .where({ telegram_id: ctx.from.id })
            .first();

          ctx.reply(
            `❌ <b>Afsus</b>, siz kodni to‘liq topa olmadingiz.\nSirli kod: <code>${ctx.session.secretCode}</code>\n💰 Eng yaxshi natijangiz uchun <b>${rewardCoins} tanga</b> qo‘shildi!\nJami tangangiz: <b>${user.coins}</b>`,
            { parse_mode: "HTML" }
          );
        } else {
          ctx.reply(
            `❌ <b>Afsus</b>, siz kodni topolmadingiz.\nSirli kod: <code>${ctx.session.secretCode}</code>\n💸 Sizga tanga berilmadi.`,
            { parse_mode: "HTML" }
          );
        }

        ctx.session.secretCode = null;
        ctx.session.attempts = 0;
      }
    }

    if (!step) return;

    if (step === "awaiting_channel") {
      if (!text.startsWith("@")) {
        return ctx.reply(`❌ Iltimos, kanal username @ bilan boshlansin.`);
      }

      ctx.session.newTask.channel_username = text;
      ctx.session.step = "awaiting_reward";
      return ctx.reply(
        "2️⃣ Har bir obunachi uchun qancha tanga berasiz? (son kiriting)"
      );
    }

    if (step === "awaiting_reward") {
      const reward = parseInt(text);
      if (isNaN(reward) || reward <= 0) {
        return ctx.reply("❌ Iltimos, to‘g‘ri son kiriting.");
      }

      ctx.session.newTask.reward_per_subscriber = reward;
      ctx.session.step = "awaiting_max";
      return ctx.reply("3️⃣ Maksimal obunachi sonini kiriting:");
    }

    if (step === "awaiting_max") {
      const max = parseInt(text);
      if (isNaN(max) || max <= 0) {
        return ctx.reply("❌ Iltimos, to‘g‘ri son kiriting.");
      }

      ctx.session.newTask.max_subscribers = max;

      // Hammasini yig‘ib oldik
      const task = ctx.session.newTask;

      const totalCoinsRequired =
        task.reward_per_subscriber * task.max_subscribers;

      // User yetarli tangaga egami?
      const user = await db("users").where({ telegram_id }).first();
      if (!user || user.coins < totalCoinsRequired) {
        ctx.session = null;
        return ctx.reply(
          `❌ Sizda yetarli tanga yo‘q. Kerak: ${totalCoinsRequired} tanga, Sizda: ${user.coins}`
        );
      }

      // Bot kanalga adminmi?
      const BOT_ID = (await ctx.telegram.getMe()).id;
      try {
        const member = await ctx.telegram.getChatMember(
          task.channel_username,
          BOT_ID
        );
        const status = member.status;

        if (status !== "administrator" && status !== "creator") {
          ctx.session = null;
          return ctx.reply(
            "❌ Bot kanalga admin emas. Iltimos, avval botni kanalga admin qiling."
          );
        }
      } catch (err) {
        ctx.session = null;
        return ctx.reply(
          "❌ Kanalga kira olmadim. Username to‘g‘riligini tekshiring va botni aʼzo qiling."
        );
      }

      // Taskni DB ga yozish
      await db("tasks").insert({
        owner_telegram_id: telegram_id,
        channel_username: task.channel_username,
        reward_per_subscriber: task.reward_per_subscriber,
        max_subscribers: task.max_subscribers,
      });

      // Tangani yechish
      await db("users")
        .where({ telegram_id })
        .update({
          coins: user.coins - totalCoinsRequired,
        });

      ctx.session = null;
      return ctx.reply(
        "✅ Topshiriq muvaffaqiyatli qo‘shildi! Endi boshqa foydalanuvchilar uni bajarishadi."
      );
    }

    if (step === "guessing_lucky_number") {
      const userId = telegram_id;

      const guess = parseInt(text);

      if (isNaN(guess) || guess < 1 || guess > 10) {
        return ctx.reply("❗ Iltimos, 1 dan 10 gacha butun son kiriting.");
      }

      const botNumber = ctx.session.botNumber;
      const diff = Math.abs(botNumber - guess);

      let reward = 0;

      if (guess === botNumber) {
        reward = 50;
        await updateUserCoins(userId, reward);
        await ctx.reply(
          `🎉 Zo'r! To'g'ri topdingiz: ${botNumber}\n💰 Sizga ${reward} tanga qo‘shildi!`
        );
      } else {
        reward = diff;
        await updateUserCoins(userId, reward);
        await ctx.reply(
          `😅 Men ${botNumber} sonini o‘ylagandim.\n🎁 Sizga ${reward} tanga berildi!`
        );
      }

      ctx.session.step = null;
      ctx.session.botNumber = null;

      return ctx.reply("🔁 Yana o‘ynash uchun menyudan tanlang:", {
        reply_markup: {
          keyboard: [
            [{ text: "🎲 Omadli raqam o'yini" }],
            [{ text: "🔙 Orqaga" }],
          ],
          resize_keyboard: true,
        },
      });
    }

    if (step === "awaiting_coin_amount") {
      const coinAmount = parseInt(ctx.message.text);

      if (isNaN(coinAmount) || coinAmount <= 0) {
        return ctx.reply("❌ Tanga soni noto‘g‘ri.");
      }

      const rate = COIN_TO_CASH_RATE; // tanga -> so‘m kursi
      const cashPreview = coinAmount * rate;

      // Minimal pul yechish (so'm) sharti
      const MIN_CASH = 1000;
      // Minimal tanga yechish (soni)
      const MIN_COIN = 1000;

      // Agar tanga minimaldan kam bo‘lsa
      if (coinAmount < MIN_COIN) {
        return ctx.reply(
          `⚠️ Minimal yechish miqdori ${MIN_COIN} tanga.\n🎯 O‘yin o‘ynang, bonus oling va ko‘proq pul ishlang!`
        );
      }

      // Agar pul 1000 so‘mdan kam bo‘lsa
      if (cashPreview < MIN_CASH) {
        // Minimal pulga erishish uchun kerak bo‘ladigan tanga sonini hisoblash
        const neededCoins = Math.ceil(MIN_CASH / rate);
        return ctx.reply(
          `⚠️ Siz ${coinAmount} tanga (${cashPreview} so‘m) yechmoqchisiz.\n` +
            `💡 Minimal yechish miqdori ${MIN_CASH} so‘m.\n` +
            `👉 Siz kamida ${
              neededCoins + 10
            } tanga yechishingiz kerak bo‘ladi.`
        );
      }

      const user = await db("users")
        .where({ telegram_id: ctx.from.id })
        .first();

      if (!user || user.coins < coinAmount) {
        return ctx.reply("❌ Sizda buncha tanga yo‘q.");
      }

      // Qoldiq hisoblash
      const withdrawableAmount =
        Math.floor(coinAmount / QOLDIQ_BULINSIN) * QOLDIQ_BULINSIN;
      const remainder = coinAmount - withdrawableAmount;

      if (withdrawableAmount <= 0) {
        return ctx.reply(
          `❌ Siz faqat ${QOLDIQ_BULINSIN} birliklarda yecha olasiz.`
        );
      }

      if (remainder > 0) {
        await ctx.reply(
          `💰 Yechiladigan summa: ${withdrawableAmount} tanga.\n` +
            `🔹 Qoldiq ${remainder} tanga balansingizda qoladi.`
        );
      }

      const cash = withdrawableAmount * rate;

      ctx.session.coinAmount = withdrawableAmount; // faqat yechiladigan miqdor
      ctx.session.cashAmount = cash;
      ctx.session.step = "awaiting_card_number";

      return ctx.reply(
        `💸 ${withdrawableAmount} tanga = ${cash.toLocaleString()} so‘m\n\n💳 Karta raqamingizni yuboring:`
      );
    }

    if (step === "awaiting_card_number") {
      const card = ctx.message.text.replace(/\s+/g, "");

      if (!/^\d{16}$/.test(card)) {
        return ctx.reply("❌ Karta raqami 16 xonali bo‘lishi kerak.");
      }

      const user = await db("users")
        .where({ telegram_id: ctx.from.id })
        .first();

      // so‘rovni saqlash
      await db("withdraw_requests").insert({
        user_id: user.id,
        coins: ctx.session.coinAmount,
        amount: ctx.session.cashAmount,
        card_number: card,
      });

      // tangani kamaytirish
      await db("users")
        .where({ id: user.id })
        .decrement("coins", ctx.session.coinAmount);

      // adminni xabardor qilish
      await ctx.telegram.sendMessage(
        process.env.ADMIN_ID,
        `💵 Yangi pul yechish so‘rovi:\n👤 @${
          user.username || "no_username"
        }\n🆔 ${user.telegram_id}\n💰 ${
          ctx.session.coinAmount
        } tanga (${ctx.session.cashAmount.toLocaleString()} so‘m)\n💳 ${card}`
      );

      ctx.session.step = null;
      return ctx.reply(
        "✅ So‘rovingiz qabul qilindi. Tez orada ko‘rib chiqiladi."
      );
    }
  });

  bot.on("callback_query", async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const telegram_id = ctx.from.id;
    const data = ctx.callbackQuery.data;

    if (data.startsWith("buy_worker_")) {
      const workerId = parseInt(data.split("_")[2]);
      const worker = await db("workers").where({ id: workerId }).first();

      if (!worker) {
        return ctx.answerCbQuery("❌ Ishchi topilmadi.");
      }

      const user = await db("users")
        .where({ telegram_id: ctx.from.id })
        .first();

      if (!user) {
        return ctx.answerCbQuery("❌ Foydalanuvchi topilmadi.");
      }

      if (user.coins < worker.price) {
        return ctx.answerCbQuery("💰 Tangangiz yetarli emas!", {
          show_alert: true,
        });
      }

      // Pul yechish
      await db("users")
        .where({ telegram_id: ctx.from.id })
        .update({ coins: user.coins - worker.price });

      // Foydalanuvchiga ishchi qo'shish
      await db("user_workers").insert({
        user_id: user.telegram_id, // Eslatma: bu yer user.id bo’lsa kerak
        worker_id: worker.id,
        quantity: 1,
        last_collected: new Date().toISOString(),
      });

      ctx.answerCbQuery(`✅ ${worker.name} sotib olindi!`);
      ctx.reply(`🎉 Siz ${worker.name} ishchisini sotib oldingiz!`);
    }

    if (callbackData === "check_subscription") {
      const task = ctx.session.currentTask;

      if (!task) {
        return ctx.answerCbQuery(
          "❌ Topshiriq topilmadi. Iltimos, qayta urinib ko‘ring.",
          { show_alert: true }
        );
      }

      try {
        // 1. Foydalanuvchining obuna holatini tekshirish
        const member = await ctx.telegram.getChatMember(
          task.channel_username,
          telegram_id
        );
        const status = member.status;

        const isSubscribed = ["member", "administrator", "creator"].includes(
          status
        );

        if (!isSubscribed) {
          return ctx.answerCbQuery(
            "❌ Siz hali obuna bo‘lmagansiz. Iltimos, avval kanalga obuna bo‘ling!",
            { show_alert: true }
          );
        }

        // 2. Foydalanuvchiga tanga beramiz
        const user = await db("users").where({ telegram_id }).first();

        await db("users")
          .where({ telegram_id })
          .update({
            coins: user.coins + task.reward_per_subscriber,
          });

        // 3. Subscriptions jadvaliga yozamiz
        await db("subscriptions").insert({
          subscriber_id: telegram_id,
          task_id: task.id,
          is_verified: true,
        });

        // 4. Taskdagi hozirgi subscriber sonini oshiramiz
        await db("tasks")
          .where({ id: task.id })
          .increment("current_subscribers", 1);

        // 5. Javob qaytaramiz
        ctx.session.currentTask = null;

        await ctx.editMessageReplyMarkup(); // Inline tugmalarni olib tashlash

        return ctx.reply(
          `✅ Obuna tasdiqlandi!\n💰 Sizga ${task.reward_per_subscriber} tanga qo‘shildi.`
        );
      } catch (err) {
        console.error("Obuna tekshirishda xato:", err);
        return ctx.answerCbQuery(
          "❌ Tekshiruvda xatolik. Bot kanalga kira olmayapti yoki siz blocklagansiz.",
          { show_alert: true }
        );
      }
    }

    if (!data.startsWith("approve_") && !data.startsWith("reject_")) {
      return;
    }

    const isApprove = data.startsWith("approve_");
    const requestId = parseInt(data.split("_")[1]);

    const request = await db("withdraw_requests")
      .where({ "withdraw_requests.id": requestId }) // BU YER TO‘G‘RILANDI
      .join("users", "withdraw_requests.user_id", "users.id")
      .select("withdraw_requests.*", "users.telegram_id", "users.username")
      .first();

    if (!request || request.status !== "pending") {
      return ctx.reply("❌ Bu so‘rov allaqachon ko‘rib chiqilgan.");
    }

    if (isApprove) {
      // Tasdiqlash
      await db("withdraw_requests")
        .where({ id: requestId })
        .update({ status: "approved" });

      await ctx.telegram.sendMessage(
        request.telegram_id,
        `✅ So‘rovingiz qabul qilindi. ${request.amount.toLocaleString()} so‘m kartangizga o‘tkazildi.\n💳 ${
          request.card_number
        }`
      );

      await ctx.editMessageText(`✅ So‘rov ID ${request.id} to‘landi.`);
    } else {
      // Rad etish → tangani foydalanuvchiga qaytaramiz
      await db("withdraw_requests")
        .where({ id: requestId })
        .update({ status: "rejected" });

      await db("users")
        .where({ id: request.user_id })
        .increment("coins", request.coins);

      await ctx.telegram.sendMessage(
        request.telegram_id,
        `❌ So‘rovingiz rad etildi. ${request.coins} tanga hisobingizga qaytarildi. \n Sababini bilish uchun admin bilan bog‘laning: @sherozbek_17`
      );

      await ctx.editMessageText(`❌ So‘rov ID ${request.id} rad etildi.`);
    }
  });

  bot.on(["photo", "document", "text"], async (ctx) => {
    const telegram_id = ctx.from.id;
    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : "username yo'q";
    const fullName = `${ctx.from.first_name || ""} ${
      ctx.from.last_name || ""
    }`.trim();

    // To‘lovga oid matn bo‘lsa
    if (
      ctx.message.caption?.toLowerCase().includes("tanga") ||
      ctx.message.text?.toLowerCase().includes("to‘lov")
    ) {
      // 1. To‘lov xabarini adminga forward qilish
      await ctx.forwardMessage(ADMIN_ID);

      // 2. Foydalanuvchi haqida qo‘shimcha ma’lumot yuborish
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `🧾 To‘lov yuborgan foydalanuvchi:\n👤 Ism: ${fullName}\n🔗 Username: ${username}\n🆔 Telegram ID: ${telegram_id}`
      );

      // 3. Foydalanuvchiga javob qaytarish
      await ctx.reply(
        "✅ To‘lov qabul qilindi. Tez orada admin tomonidan tekshiriladi."
      );
    }
  });
};
