require("dotenv").config();

const ADMIN_IDS = process.env.ADMIN_ID.split(",").map((id) => parseInt(id));

function isAdmin(ctx) {
  return ADMIN_IDS.includes(ctx.from.id);
}

function adminOnly(handler) {
  return async (ctx, next) => {
    if (isAdmin(ctx)) {
      return handler(ctx, next);
    } else {
      return ctx.reply("❌ Sizga bu buyruqdan foydalanishga ruxsat yo‘q.");
    }
  };
}

module.exports = { isAdmin, adminOnly };
