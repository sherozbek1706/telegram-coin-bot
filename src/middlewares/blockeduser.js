// middlewares/blockCheck.js
const blockedUsers = [
  2097437601, 5517299288, 6529955986, 5843798537, 5320189536,
];
// const blockedUsers = [];

module.exports = () => {
  return async (ctx, next) => {
    if (ctx.from && blockedUsers.includes(ctx.from.id)) {
      await ctx.reply("❌ Siz admin tomonidan bloklangansiz");
      return; // davom etmaydi
    }
    return next();
  };
};
