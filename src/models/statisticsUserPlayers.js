const getUserPlayersStatistics = require("../functions/getUserPlayersStatistics");

module.exports = async (bot, db) => {
  bot.hears("📊 Statistika", async (ctx) => {
    try {
      const statsData = await getUserPlayersStatistics({
        telegram_id: ctx.from.id,
        db,
      });

      const stats = statsData.statistics;
      const byStatus = stats.byStatus;

      // HTML formatida xabar tayyorlash
      let message = `<b>📊 Sizning futbolchilar statistikangiz</b>\n\n`;
      message += `<b>💰 Jami futbolchilar soni:</b> ${stats.total}\n\n`;

      message += `<b>${byStatus.legendary.label}</b>\n`;
      message += `- Futbolchi soni: ${byStatus.legendary.count}\n`;
      message += `- Umumiy soni: ${byStatus.legendary.quantity}\n\n`;

      message += `<b>${byStatus.medium.label}</b>\n`;
      message += `- Futbolchi soni: ${byStatus.medium.count}\n`;
      message += `- Umumiy soni: ${byStatus.medium.quantity}\n\n`;

      message += `<b>${byStatus.basic.label}</b>\n`;
      message += `- Futbolchi soni: ${byStatus.basic.count}\n`;
      message += `- Umumiy soni: ${byStatus.basic.quantity}\n`;

      await ctx.reply(message, { parse_mode: "HTML" });
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      await ctx.reply(
        "❌ Statistika chiqarishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
      );
    }
  });
};
