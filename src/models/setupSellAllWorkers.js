let i = 1;

module.exports = function setupSellWorkers(bot, db) {
  // Step 1: Boshlash

  bot.hears("💼 Ishchilarni sotish", async (ctx) => {
    const telegramId = ctx.from.id;

    const user = await db("users").where({ telegram_id: telegramId }).first();
    if (!user) {
      return ctx.reply("❌ Siz ro'yxatdan o'tmagansiz.");
    }

    const workers = await db("user_workers")
      .join("workers", "user_workers.worker_id", "workers.id")
      .where("user_workers.user_id", telegramId)
      .select(
        "workers.id",
        "workers.name",
        db.raw("SUM(user_workers.quantity) as total_quantity")
      )
      .groupBy("workers.id", "workers.name");

    if (workers.length === 0) {
      return ctx.reply("❌ Sizda sotadigan ishchi yo'q.");
    }

    const buttons = workers.map((w) => [
      {
        text: `${w.name} (${w.total_quantity} ta)`,
        callback_data: `sell_worker_${w.id}`,
      },
    ]);

    await ctx.reply("Qaysi ishchini sotmoqchisiz?", {
      reply_markup: { inline_keyboard: buttons },
    });
  });

  // Ishchini tanlash (callback)
  bot.action(/sell_worker_(\d+)/, async (ctx) => {
    const telegramId = ctx.from.id;
    const workerId = Number(ctx.match[1]);

    const worker = await db("user_workers")
      .join("workers", "user_workers.worker_id", "workers.id")
      .where({ user_id: telegramId, worker_id: workerId })
      .select(
        "workers.name",
        db.raw("SUM(user_workers.quantity) as total_quantity")
      )
      .groupBy("workers.name")
      .first();

    if (!worker) {
      return ctx.answerCbQuery("❌ Sizda bu ishchidan yo‘q.");
    }

    ctx.session.selling = {
      workerId,
      step: "ask_quantity",
    };

    await ctx.reply(
      `Nechta "${worker.name}" sotmoqchisiz? (Maks: ${worker.total_quantity})\n` +
        `Iltimos, faqat raqam kiriting.`
    );
  });

  // Miqdorni kiritish
  bot.hears(/^\d+$/, async (ctx, next) => {
    if (!ctx.session.selling || ctx.session.selling.step !== "ask_quantity")
      return next();

    const telegramId = ctx.from.id;
    const qty = Number(ctx.message.text);

    if (qty <= 0) {
      return ctx.reply("❌ Miqdor 0 dan katta bo‘lishi kerak.");
    }

    const uw = await db("user_workers")
      .join("workers", "user_workers.worker_id", "workers.id")
      .where({ user_id: telegramId, worker_id: ctx.session.selling.workerId })
      .select(
        "workers.price",
        "workers.name",
        db.raw("SUM(user_workers.quantity) as total_quantity")
      )
      .groupBy("workers.price", "workers.name")
      .first();

    if (!uw || qty > uw.total_quantity) {
      return ctx.reply(`❌ Sizda bu miqdorda "${uw?.name || "ishchi"}" yo‘q.`);
    }

    const totalPrice = uw.price * qty;
    const earned = Math.floor(totalPrice * 0.5);

    ctx.session.selling.qty = qty;
    ctx.session.selling.earned = earned;
    ctx.session.selling.name = uw.name;
    ctx.session.selling.step = "confirm";

    return ctx.reply(
      `🛒 ${qty} ta "${uw.name}" sotmoqchimisiz?\n💰 Sizga ${earned} tanga beriladi.`,
      {
        reply_markup: {
          keyboard: [["✅ Sotaman", "❌ Bekor qilish"]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  });

  // Tasdiqlash
  bot.hears("✅ Sotaman", async (ctx) => {
    if (!ctx.session.selling || ctx.session.selling.step !== "confirm") return;

    const telegramId = ctx.from.id;
    const { workerId, qty, earned } = ctx.session.selling;
    let qtyToRemove = qty;

    // Ishchilarni tartiblab olish
    const rows = await db("user_workers")
      .where({ user_id: telegramId, worker_id: workerId })
      .orderBy("id", "asc");

    for (const row of rows) {
      if (qtyToRemove <= 0) break;

      if (row.quantity <= qtyToRemove) {
        await db("user_workers").where({ id: row.id }).del();
        qtyToRemove -= row.quantity;
      } else {
        await db("user_workers")
          .where({ id: row.id })
          .decrement("quantity", qtyToRemove);
        qtyToRemove = 0;
      }
    }

    // Foydalanuvchiga tangani qo‘shish
    await db("users")
      .where({ telegram_id: telegramId })
      .increment("coins", earned);

    ctx.session.selling = null;
    return ctx.reply(`✅ Sotildi! Siz ${earned} tanga qo‘lga kiritdingiz.`, {
      reply_markup: {
        keyboard: [["🔙 Orqaga"]],
        resize_keyboard: true,
      },
    });
  });

  // Bekor qilish
  bot.hears("❌ Bekor qilish", (ctx) => {
    if (!ctx.session.selling) return;
    ctx.session.selling = null;
    return ctx.reply("❌ Sotish bekor qilindi.", {
      reply_markup: {
        keyboard: [["🔙 Orqaga"]],
        resize_keyboard: true,
      },
    });
  });
};
