const onlyPrivate = async (ctx, next) => {
  if (ctx.chat.type === "private") {
    return next();
  } else {
    // Guruh yoki kanal bo‘lsa, javob bermaydi yoki boshqa xabar beradi
    return null;
  }
};

module.exports = onlyPrivate;
