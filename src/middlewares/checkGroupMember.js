const REQUIRED_GROUP_USERNAME = "@obunachimmisiz_chat"; // guruh username (@ bilan)

const checkGroupMember = async (ctx, next) => {
  try {
    // Guruh a’zoligini tekshirish
    const member = await ctx.telegram.getChatMember(
      REQUIRED_GROUP_USERNAME,
      ctx.from.id
    );

    if (member.status === "left" || member.status === "kicked") {
      // Agar foydalanuvchi guruhda bo‘lmasa
      return ctx.reply(
        `🚫 Siz guruhimiz a'zosi emassiz. Iltimos, quyidagi guruhga qo'shiling:\nhttps://t.me/${REQUIRED_GROUP_USERNAME.replace(
          "@",
          ""
        )}`
      );
    }

    // Agar a’zo bo‘lsa keyingi middleware yoki handlerga o‘tadi
    return next();
  } catch (error) {
    console.error("getChatMember xatolik:", error);
    return ctx.reply(
      "Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring."
    );
  }
};

module.exports = checkGroupMember;
