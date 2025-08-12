module.exports = function checkTask(db) {
  return async (ctx, next) => {
    try {
      const telegramId = ctx.from.id;

      const user = await db("users").where({ telegram_id: telegramId }).first();

      if (user?.coin <= 800) {
        return next();
      } else {
        // Foydalanuvchi aktiv vazifasi bormi?
        const activeTask = await db("tasks")
          .where({
            owner_telegram_id: telegramId,
            is_active: true,
          })
          .first();

        if (!activeTask) {
          await ctx.reply(
            "❗ Sizda aktiv topshiriq yoki vazifa yo‘q.\n\nIltimos, avval vazifa qo‘shing.",
            {
              reply_markup: {
                keyboard: [[{ text: "📋 Vazifalar bo‘limi" }]],
                resize_keyboard: true,
              },
            }
          );
          return; // keyingi handlerlarga o'tkazmaydi
        }

        return next();
      }

      // Agar vazifasi bo‘lsa davom etamiz
    } catch (err) {
      console.error("checkTask middleware error:", err);
      await ctx.reply("Xatolik yuz berdi. Keyinroq urinib ko‘ring.");
    }
  };
};
