let attempts = 0;

// middlewares/checkPhone.js
module.exports = function checkPhone(db) {
  return async (ctx, next) => {
    attempts++;
    try {
      if (!ctx.from || !ctx.from.id) return;

      const user = await db("users")
        .where({ telegram_id: ctx.from.id })
        .first();

      console.log(
        `Hozirda foydalanyabdi - ${user?.phone_number} - ${attempts}`
      );

      if (!user || !user.phone_number) {
        await ctx.reply(
          "📱 Botdan foydalanish uchun telefon raqamingizni yuboring",
          {
            reply_markup: {
              keyboard: [
                [
                  {
                    text: "📲 Telefon raqamni yuborish",
                    request_contact: true,
                  },
                ],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
        return; // telefon raqami yo‘q bo‘lsa, boshqa kod ishlamaydi
      }

      await next();
    } catch (error) {
      console.error("checkPhone middleware error:", error);
    }
  };
};
